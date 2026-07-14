import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import {
  listPrograms, listPhases, listCompletions, markWorkoutComplete,
  isCompletedToday, getWeekLogs, upsertWeekLog, updateExercise,
} from '../../data/programs'
import { localISODate } from '../../lib/date'
import { SkeletonScreen, Eyebrow, Card, Empty, showToast } from '../../components/ui/primitives'
import { IconPlay, IconCheck } from '../../components/ui/Icons'

const DEFAULT_WEEKS = 6

// ---------- Live session timing (rest timer + total workout duration) ----------
// Kept in localStorage, not the DB - this is a live-use aid for whoever's
// running today's session (coach logged in as the client, in the room), not
// a historical record. Keyed by day + today's date so switching tabs mid-set
// or the phone locking doesn't lose progress, but a repeat of the same day
// next week starts every set unchecked again.

function freshSession() {
  return { date: localISODate(), startedAt: Date.now(), sets: {}, restEndsAt: null }
}

function loadSession(dayId) {
  try {
    const raw = localStorage.getItem(`pf-session-${dayId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Stale session from a previous day - don't resurrect yesterday's ticks.
    return parsed.date === localISODate() ? parsed : null
  } catch { return null }
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// Leading integer set count ("3" -> 3, "3 rounds" -> 3, "Sets"/"" -> null) -
// only exercises with a clean count get tappable set buttons; anything else
// falls back to the plain spec text so odd paste-import data doesn't break.
function parseSetCount(val) {
  const m = String(val ?? '').match(/^\s*(\d+)/)
  return m ? Number(m[1]) : null
}

// Rest duration in seconds from free-text coach input. Real data in this
// project is almost all "60s"/"45s"/"2min", plus a `"` seconds mark from a
// past paste-import ("45\""). Text like "Nghỉ" or "phần còn lại nghỉ" means
// "rest as needed" / EMOM-style - deliberately returns null there rather
// than guess a duration, since auto-starting a timer would be wrong.
function parseRestSeconds(val) {
  const s = String(val ?? '').trim().toLowerCase()
  if (!s || s === '-') return null
  let m = s.match(/(\d+)\s*min/)
  if (m) return Number(m[1]) * 60
  m = s.match(/(\d+)\s*(?:s|")/)
  if (m) return Number(m[1])
  m = s.match(/^(\d+)$/)
  if (m) return Number(m[1])
  return null
}

function Spec({ label, value }) {
  if (!value) return null
  return (
    <div style={{ minWidth: 52 }}>
      <div className="eyebrow eyebrow-muted">{label}</div>
      <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>{value}</div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Leading numeric portion of a free-text weight entry ("60kg" -> 60, "20" ->
// 20, "Bodyweight" -> null) - only entries that parse feed the trend line.
function parseWeight(val) {
  const m = String(val ?? '').match(/[\d.]+/)
  return m ? Number(m[0]) : null
}

function Sparkline({ points }) {
  // Capped well under the card's content width at a 375px viewport - the
  // row also carries the "Mức tạ theo tuần" label, so a 200px chart could
  // force a wrap or overflow next to it.
  const width = 140
  const height = 32
  const pad = 4
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (p.value - min) / span) * (height - pad * 2)
    return [x, y]
  })
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke="var(--pf-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill="var(--pf-accent)" />)}
    </svg>
  )
}

function WeekLoadGrid({ ex, clientId, minWeeks }) {
  const { db } = useAuth()
  const [values, setValues] = useState({})
  const [savingWeek, setSavingWeek] = useState(null)
  const [extraWeeks, setExtraWeeks] = useState(0)
  const weekCount = Math.max(minWeeks || 0, DEFAULT_WEEKS) + extraWeeks
  // Debounce timers per week, keyed so typing in one cell doesn't reset another's.
  const pending = useRef({})

  useEffect(() => {
    if (!ex.id) return
    getWeekLogs(db, clientId, ex.id).then((rows) => {
      const map = {}
      rows.forEach((r) => { if (r.top_set_weight) map[r.week_number] = r.top_set_weight })
      // Merge under whatever's already typed locally - this fetch started on
      // mount and can resolve after the user's already typed a value, so a
      // flat overwrite would blank out a just-saved entry on screen (it's
      // still safely in the DB, just visually reverted, which reads as data
      // loss even though it isn't).
      setValues((prev) => ({ ...map, ...prev }))
    }).catch(() => {})
  }, [db, ex.id, clientId])

  // If the client switches exercise/day mid-typing, fire any save that was
  // still waiting on its debounce so a just-typed value isn't dropped.
  useEffect(() => () => {
    Object.entries(pending.current).forEach(([week, p]) => {
      clearTimeout(p.timeout)
      if (p.value.trim()) upsertWeekLog(db, clientId, ex.id, Number(week), p.value.trim()).catch(() => {})
    })
  }, [db, clientId, ex.id])

  async function save(week, val) {
    if (!val.trim()) return
    setSavingWeek(week)
    try { await upsertWeekLog(db, clientId, ex.id, week, val.trim()) }
    catch (e) { showToast(e.message || 'Không lưu được, thử lại.') }
    finally { setSavingWeek(null) }
  }

  // Auto-save shortly after the client stops typing - no need to tap out of
  // the field first.
  function onType(week, val) {
    setValues((v) => ({ ...v, [week]: val }))
    if (pending.current[week]) clearTimeout(pending.current[week].timeout)
    const timeout = setTimeout(() => { delete pending.current[week]; save(week, val) }, 600)
    pending.current[week] = { timeout, value: val }
  }

  // Leaving the field earlier than the debounce shouldn't wait it out.
  function flush(week, val) {
    if (pending.current[week]) { clearTimeout(pending.current[week].timeout); delete pending.current[week] }
    save(week, val)
  }

  const trendPoints = Object.entries(values)
    .map(([week, val]) => ({ week: Number(week), value: parseWeight(val) }))
    .filter((p) => p.value != null)
    .sort((a, b) => a.week - b.week)

  return (
    <div style={{ marginTop: 4 }}>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: 'var(--pf-muted)' }}>Mức tạ theo tuần</div>
        {trendPoints.length >= 2 && <Sparkline points={trendPoints} />}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: weekCount }, (_, i) => i + 1).map((week) => (
          <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--pf-muted)' }}>Tuần {week}{savingWeek === week ? ' …' : ''}</span>
            <input
              type="text"
              value={values[week] ?? ''}
              onChange={(e) => onType(week, e.target.value)}
              onBlur={(e) => flush(week, e.target.value)}
              placeholder={ex.load || '—'}
              style={{
                background: 'var(--pf-surface-2)', border: '1px solid var(--pf-line)', borderRadius: 6,
                padding: '4px 6px', fontSize: 12.5, color: 'var(--pf-text)', width: 56, textAlign: 'center',
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn-quiet"
          style={{ alignSelf: 'flex-end', fontSize: 11, padding: '4px 8px' }}
          onClick={() => setExtraWeeks((n) => n + 4)}
          title="Thêm tuần"
        >
          + Thêm tuần
        </button>
      </div>
    </div>
  )
}

function ExerciseNote({ ex }) {
  const { db } = useAuth()
  const [value, setValue] = useState(ex.client_note || '')
  const [saving, setSaving] = useState(false)
  const pending = useRef(null)

  async function save(val) {
    setSaving(true)
    try { await updateExercise(db, ex.id, { client_note: val.trim() || null }) }
    catch (e) { showToast(e.message || 'Không lưu được, thử lại.') }
    finally { setSaving(false) }
  }

  // Same debounce-while-typing, flush-on-blur pattern as the weekly weight
  // grid below - auto-saves without the client needing to tap out of the field.
  function onType(val) {
    setValue(val)
    if (pending.current) clearTimeout(pending.current)
    pending.current = setTimeout(() => { pending.current = null; save(val) }, 600)
  }
  function flush(val) {
    if (pending.current) { clearTimeout(pending.current); pending.current = null }
    save(val)
  }

  return (
    <div className="stack" style={{ gap: 4 }}>
      <div style={{ fontSize: 12, color: 'var(--pf-muted)' }}>Ghi chú của bạn{saving ? ' …' : ''}</div>
      <textarea
        value={value}
        onChange={(e) => onType(e.target.value)}
        onBlur={(e) => flush(e.target.value)}
        placeholder="Có vấn đề gì khi tập bài này? (đau, khó thở, không đúng form...)"
        rows={2}
        style={{
          background: 'var(--pf-surface-2)', border: '1px solid var(--pf-line)', borderRadius: 6,
          padding: '6px 8px', fontSize: 13, color: 'var(--pf-text)', resize: 'vertical', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function SetButtons({ ex, setsDone, onToggleSet }) {
  const count = parseSetCount(ex.sets)
  if (!count) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => i).map((i) => {
        const done = !!setsDone[i]
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggleSet(i, parseRestSeconds(ex.rest))}
            style={{
              width: 34, height: 34, borderRadius: '50%', fontSize: 13, fontWeight: 600,
              border: `1px solid ${done ? 'var(--pf-accent)' : 'var(--pf-line)'}`,
              background: done ? 'var(--pf-accent)' : 'var(--pf-surface-2)',
              color: done ? 'var(--pf-bg, #0a0a0a)' : 'var(--pf-text)',
            }}
            title={`Set ${i + 1}${done ? ' — đã xong' : ''}`}
          >
            {done ? '✓' : i + 1}
          </button>
        )
      })}
    </div>
  )
}

function ExerciseCard({ ex, clientId, minWeeks, setsDone, onToggleSet }) {
  return (
    <Card className="stack" style={{ padding: 'var(--s4)' }}>
      <div className="row" style={{ gap: 10, alignItems: 'baseline' }}>
        {ex.group_label && <span className="tag tag-accent" style={{ padding: '2px 8px' }}>{ex.group_label}</span>}
        <div className="pf-display" style={{ fontSize: 18 }}>{ex.exercise_name}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <Spec label="Sets" value={ex.sets} />
        <Spec label="Reps" value={ex.reps} />
        <Spec label="Mức tạ" value={ex.load} />
        <Spec label="Tempo" value={ex.tempo} />
        <Spec label="Nghỉ" value={ex.rest} />
        <Spec label="RPE" value={ex.rpe} />
      </div>
      {onToggleSet && <SetButtons ex={ex} setsDone={setsDone || []} onToggleSet={onToggleSet} />}
      <WeekLoadGrid ex={ex} clientId={clientId} minWeeks={minWeeks} />
      {ex.coaching_cue && (
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, borderLeft: '2px solid var(--pf-line)', paddingLeft: 12 }}>
          {ex.coaching_cue}
        </p>
      )}
      {ex.notes && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--pf-text)', borderLeft: '2px solid var(--pf-accent)', paddingLeft: 12 }}>
          {ex.notes}
        </p>
      )}
      <ExerciseNote ex={ex} />
      {ex.video_url && (
        <a href={ex.video_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <IconPlay width={16} height={16} /> Xem video
        </a>
      )}
    </Card>
  )
}

// One mounted instance per program day (keyed by day.id at the call site,
// so switching days remounts fresh rather than needing manual re-sync).
function DayWorkout({ day, clientId, minWeeks, curDone, completing, onComplete }) {
  const [session, setSession] = useState(() => (curDone ? null : loadSession(day.id) || freshSession()))
  const [, tick] = useState(0)

  useEffect(() => {
    if (!session) return
    try { localStorage.setItem(`pf-session-${day.id}`, JSON.stringify(session)) } catch {}
  }, [session, day.id])

  // Re-render every second so the elapsed/rest displays count up/down live.
  useEffect(() => {
    if (!session) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [session])

  function toggleSet(exerciseId, index, restSeconds) {
    setSession((s) => {
      if (!s) return s
      const arr = s.sets[exerciseId] ? [...s.sets[exerciseId]] : []
      const wasDone = !!arr[index]
      arr[index] = !wasDone
      const next = { ...s, sets: { ...s.sets, [exerciseId]: arr } }
      if (!wasDone && restSeconds) next.restEndsAt = Date.now() + restSeconds * 1000
      return next
    })
  }

  function skipRest() {
    setSession((s) => (s ? { ...s, restEndsAt: null } : s))
  }

  async function handleComplete() {
    const totalSeconds = session ? Math.round((Date.now() - session.startedAt) / 1000) : null
    await onComplete(totalSeconds)
    try { localStorage.removeItem(`pf-session-${day.id}`) } catch {}
  }

  const elapsed = session ? Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)) : 0
  const restRemaining = session?.restEndsAt ? Math.max(0, Math.ceil((session.restEndsAt - Date.now()) / 1000)) : 0

  return (
    <>
      <div className="row-between" style={{ alignItems: 'flex-end' }}>
        <div className="pf-display" style={{ fontSize: 20 }}>{day.workout_day}</div>
        <div className="row" style={{ gap: 10, alignItems: 'baseline' }}>
          {day.week && <div className="eyebrow eyebrow-muted">Tuần {day.week}</div>}
          {session && <div className="eyebrow eyebrow-muted" title="Thời gian buổi tập">{formatMMSS(elapsed)}</div>}
        </div>
      </div>
      {restRemaining > 0 && (
        <div className="row-between" style={{
          padding: '8px 12px', borderRadius: 8, background: 'var(--pf-surface-2)',
          border: '1px solid var(--pf-accent)', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13.5 }}>Đang nghỉ… <strong>{formatMMSS(restRemaining)}</strong></span>
          <button type="button" className="btn-quiet" style={{ fontSize: 12, padding: '4px 8px' }} onClick={skipRest}>
            Bỏ qua
          </button>
        </div>
      )}
      <div className="divider" />
      {(day.program_exercises || []).map((ex) => (
        <ExerciseCard
          key={ex.id} ex={ex} clientId={clientId} minWeeks={minWeeks}
          setsDone={session?.sets?.[ex.id]}
          onToggleSet={session ? (i, restSeconds) => toggleSet(ex.id, i, restSeconds) : null}
        />
      ))}
      {(day.program_exercises || []).length === 0 && <Empty title="Chưa có bài tập cho ngày này" />}
      <button className="btn btn-primary btn-block" onClick={handleComplete} disabled={completing || curDone}>
        {curDone ? <><IconCheck width={16} height={16} /> Đã tập xong hôm nay</> : completing ? 'Đang lưu…' : 'Đã tập xong'}
      </button>
    </>
  )
}

export default function Program() {
  const { db } = useAuth()
  const [activePhase, setActivePhase] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [completing, setCompleting] = useState(false)
  const { data, loading, reload } = useAsync(async () => {
    const me = await getMyClient(db)
    if (!me) return { programs: [], phaseRows: [], completions: [], clientId: null }
    const [programs, phaseRows, completions] = await Promise.all([
      listPrograms(db, me.id),
      listPhases(db, me.id),
      listCompletions(db, me.id),
    ])
    return { programs, phaseRows, completions, clientId: me.id }
  }, [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  const programs = data?.programs || []
  const phaseRows = data?.phaseRows || []
  const completions = data?.completions || []
  const clientId = data?.clientId

  const UNASSIGNED = 'Chưa phân phase'
  const phases = []
  programs.forEach((p) => {
    const ph = p.phase || UNASSIGNED
    if (!phases.includes(ph)) phases.push(ph)
  })

  const selectedPhase = activePhase ?? phases[0] ?? null
  const phaseRow = phaseRows.find((p) => p.name === selectedPhase)
  const phaseDays = programs.filter((p) => (p.phase || UNASSIGNED) === selectedPhase)
  const cur = phaseDays[activeDay] ?? phaseDays[0] ?? null
  const curDone = cur ? isCompletedToday(completions, cur.id) : false
  const phaseEnd = phaseRow?.start_date && phaseRow?.weeks ? addDays(phaseRow.start_date, phaseRow.weeks * 7) : null

  function selectPhase(ph) {
    setActivePhase(ph)
    setActiveDay(0)
  }

  async function complete(durationSeconds) {
    if (!cur || curDone) return
    setCompleting(true)
    try { await markWorkoutComplete(db, cur.id, durationSeconds); await reload() }
    catch (e) { showToast(e.message || 'Không lưu được, thử lại.') }
    finally { setCompleting(false) }
  }

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Chương trình</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Giáo án</h1>
      </div>

      {programs.length === 0 ? (
        <Empty title="Chưa có giáo án" hint="HLV đang hoàn thiện chương trình cho bạn." />
      ) : (
        <>
          {phases.length > 1 && (
            <div className="seg-tabs">
              {phases.map((ph) => (
                <button
                  key={ph}
                  onClick={() => selectPhase(ph)}
                  className={`seg-tab seg-tab-accent${ph === selectedPhase ? ' active' : ''}`}
                >
                  {ph}
                </button>
              ))}
            </div>
          )}

          {phaseRow?.start_date && (
            <div className="eyebrow eyebrow-muted">
              {formatDate(phaseRow.start_date)}{phaseEnd ? ` → ${formatDate(phaseEnd)}` : ''}
            </div>
          )}
          {phaseRow?.objective && (
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{phaseRow.objective}</p>
          )}

          <div className="seg-tabs">
            {phaseDays.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveDay(i)}
                className={`seg-tab${i === activeDay ? ' active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {isCompletedToday(completions, p.id) && <IconCheck width={12} height={12} />}
                {p.workout_day || `Ngày ${i + 1}`}
              </button>
            ))}
          </div>

          {cur && (
            <DayWorkout
              key={cur.id}
              day={cur}
              clientId={clientId}
              minWeeks={phaseRow?.weeks}
              curDone={curDone}
              completing={completing}
              onComplete={complete}
            />
          )}
        </>
      )}
    </div>
  )
}

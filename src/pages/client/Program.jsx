import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import {
  listPrograms, listPhases, listCompletions, markWorkoutComplete,
  isCompletedToday, getWeekLogs, upsertWeekLog,
} from '../../data/programs'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import { IconPlay } from '../../components/ui/Icons'

const DEFAULT_WEEKS = 6

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
  const width = 200
  const height = 36
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

  async function save(week, val) {
    if (!val.trim()) return
    setSavingWeek(week)
    try { await upsertWeekLog(db, clientId, ex.id, week, val.trim()) }
    catch (e) { alert(e.message || 'Không lưu được, thử lại.') }
    finally { setSavingWeek(null) }
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
              onChange={(e) => setValues((v) => ({ ...v, [week]: e.target.value }))}
              onBlur={(e) => save(week, e.target.value)}
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

function ExerciseCard({ ex, clientId, minWeeks }) {
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
      <WeekLoadGrid ex={ex} clientId={clientId} minWeeks={minWeeks} />
      {ex.coaching_cue && (
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, borderLeft: '2px solid var(--pf-line)', paddingLeft: 12 }}>
          {ex.coaching_cue}
        </p>
      )}
      {ex.notes && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--pf-accent)', borderLeft: '2px solid var(--pf-accent)', paddingLeft: 12 }}>
          {ex.notes}
        </p>
      )}
      {ex.video_url && (
        <a href={ex.video_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <IconPlay width={16} height={16} /> Xem video
        </a>
      )}
    </Card>
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

  if (loading) return <div className="screen"><InlineLoader /></div>
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

  async function complete() {
    if (!cur || curDone) return
    setCompleting(true)
    try { await markWorkoutComplete(db, cur.id); await reload() }
    catch (e) { alert(e.message || 'Không lưu được, thử lại.') }
    finally { setCompleting(false) }
  }

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Chương trình</Eyebrow>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Giáo án</h1>
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
              >
                {isCompletedToday(completions, p.id) ? '✓ ' : ''}{p.workout_day || `Ngày ${i + 1}`}
              </button>
            ))}
          </div>

          {cur && (
            <>
              <div className="row-between" style={{ alignItems: 'flex-end' }}>
                <div className="pf-display" style={{ fontSize: 20 }}>{cur.workout_day}</div>
                {cur.week && <div className="eyebrow eyebrow-muted">Tuần {cur.week}</div>}
              </div>
              <div className="divider" />
              {(cur.program_exercises || []).map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} clientId={clientId} minWeeks={phaseRow?.weeks} />
              ))}
              {(cur.program_exercises || []).length === 0 && <Empty title="Chưa có bài tập cho ngày này" />}
              <button className="btn btn-primary btn-block" onClick={complete} disabled={completing || curDone}>
                {curDone ? '✓ Đã tập xong hôm nay' : completing ? 'Đang lưu…' : 'Đã tập xong'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}

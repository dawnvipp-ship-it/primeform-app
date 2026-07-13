import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listPrograms, createProgramDay, deleteProgramDay, setDayExercises, updateProgramDay,
  listPhases, upsertPhase, deletePhaseRow, reorderPhases, renamePhaseOnDays, deletePhaseDays,
} from '../../../data/programs'
import { Card, Eyebrow, Field, Input, Textarea, Modal, Empty, InlineLoader, showToast, confirmDialog } from '../../../components/ui/primitives'
import { IconPlus, IconTrash, IconCheck, IconEdit, IconChevron, IconX } from '../../../components/ui/Icons'
import { MUSCLE_GROUPS, detectMuscleGroups } from '../../../data/muscleGroups'
import { localISODate } from '../../../lib/date'

const COLS = ['group_label', 'exercise_name', 'sets', 'reps', 'tempo', 'rest', 'load', 'rpe', 'coaching_cue', 'notes']
const HEADER = 'Nhóm | Tên bài | Sets | Reps | Tempo | Nghỉ | Mức tạ | RPE | Cue | Ghi chú'
const PRESET_PHASES = ['Phase 1', 'Phase 2', 'Phase 3']
const UNASSIGNED = '— Chưa phân phase'

function exercisesToText(list) {
  return (list || []).map((ex) => COLS.map((c) => (ex[c] ?? '')).join(' | ')).join('\n')
}

function parseText(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const parts = line.split(line.includes('\t') ? '\t' : '|').map((s) => s.trim())
    const ex = {}
    COLS.forEach((c, i) => { ex[c] = parts[i] || null })
    if (parts.length === 1) { ex.group_label = null; ex.exercise_name = parts[0] }
    return ex
  }).filter((ex) => ex.exercise_name)
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

function DayCard({ day, allDays, onChanged, onDelete }) {
  const { db } = useAuth()
  const [text, setText] = useState(exercisesToText(day.program_exercises))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  const [meta, setMeta] = useState({ phase: day.phase || '', workout_day: day.workout_day || '' })
  const count = text.split('\n').filter((l) => l.trim()).length

  async function save() {
    setBusy(true); setSaved(false)
    try {
      const exercises = parseText(text)
      await setDayExercises(db, day.id, exercises)
      // Only pre-fill if the coach hasn't tagged this day yet - never
      // silently override a manual choice on a re-save.
      if ((day.muscle_groups || []).length === 0) {
        const guess = detectMuscleGroups([day.workout_day, ...exercises.flatMap((ex) => [ex.exercise_name, ex.group_label])])
        if (guess.length > 0) await updateProgramDay(db, day.id, { muscle_groups: guess })
      }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      onChanged?.()
    } finally { setBusy(false) }
  }

  async function autoDetectMuscleGroups() {
    try {
      const exercises = parseText(text)
      const guess = detectMuscleGroups([day.workout_day, ...exercises.flatMap((ex) => [ex.exercise_name, ex.group_label])])
      await updateProgramDay(db, day.id, { muscle_groups: guess })
      onChanged?.()
    } catch (e) {
      showToast(e.message || 'Không nhận diện được, thử lại.')
    }
  }

  async function saveMeta() {
    setBusy(true)
    try {
      await updateProgramDay(db, day.id, {
        phase: meta.phase || null,
        workout_day: meta.workout_day || day.workout_day,
      })
      setEditing(false); onChanged?.()
    } finally { setBusy(false) }
  }

  async function toggleCountsForNext(checked) {
    try {
      await updateProgramDay(db, day.id, { counts_for_next: checked })
      onChanged?.()
    } catch (e) {
      showToast(e.message || 'Không lưu được, thử lại.')
    }
  }

  async function toggleMuscleGroup(groupId, checked) {
    try {
      const current = day.muscle_groups || []
      const next = checked ? [...current, groupId] : current.filter((g) => g !== groupId)
      await updateProgramDay(db, day.id, { muscle_groups: next })
      onChanged?.()
    } catch (e) {
      showToast(e.message || 'Không lưu được, thử lại.')
    }
  }

  const existingPhases = (allDays || []).map((d) => d.phase).filter(Boolean)
    .filter((ph, i, arr) => arr.indexOf(ph) === i && !PRESET_PHASES.includes(ph))

  return (
    <Card className="stack">
      <div className="row-between">
        {editing ? (
          <div className="stack" style={{ flex: 1, gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input
                  list={`phase-edit-${day.id}`}
                  value={meta.phase}
                  onChange={(e) => setMeta({ ...meta, phase: e.target.value })}
                  placeholder="Phase 1"
                  style={{ fontSize: 13 }}
                />
                <datalist id={`phase-edit-${day.id}`}>
                  {PRESET_PHASES.map((ph) => <option key={ph} value={ph} />)}
                  {existingPhases.map((ph) => <option key={ph} value={ph} />)}
                </datalist>
              </div>
            </div>
            <Input value={meta.workout_day} onChange={(e) => setMeta({ ...meta, workout_day: e.target.value })} placeholder="Tên ngày" style={{ fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={saveMeta} disabled={busy}>{busy ? '…' : 'Lưu'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setMeta({ phase: day.phase || '', workout_day: day.workout_day || '' }) }}>Huỷ</button>
            </div>
          </div>
        ) : (
          <div style={{ cursor: 'pointer' }} onClick={() => setEditing(true)}>
            <div className="pf-display" style={{ fontSize: 18 }}>{day.workout_day}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {day.phase || '—'}
              <span style={{ marginLeft: 6, opacity: 0.45, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 2 }}><IconEdit width={11} height={11} /> sửa</span>
            </div>
          </div>
        )}
        {!editing && <button className="btn-quiet" onClick={() => onDelete(day.id)} style={{ color: 'var(--pf-danger)' }}><IconTrash width={16} height={16} /></button>}
      </div>

      <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={day.counts_for_next !== false}
          onChange={(e) => toggleCountsForNext(e.target.checked)}
        />
        <span style={{ fontSize: 12.5, color: 'var(--pf-muted)' }}>
          Tính vào "Buổi kế tiếp" (bỏ chọn cho cardio, giãn cơ...)
        </span>
      </label>

      <div>
        <div className="row-between" style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11.5, color: 'var(--pf-muted)' }}>
            Nhóm cơ của ngày này (để tô lên hình người ở Tiến độ)
          </div>
          <button type="button" className="btn-quiet" style={{ fontSize: 11, padding: '2px 8px' }} onClick={autoDetectMuscleGroups}>
            Tự động nhận diện
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MUSCLE_GROUPS.map((g) => {
            const active = (day.muscle_groups || []).includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: 11.5, padding: '4px 10px' }}
                onClick={() => toggleMuscleGroup(g.id, !active)}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="divider" />
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`A1 | Goblet Squat | 3 | 10 | 3-1-2 | 90s | 20kg | 8 | Ngực mở | set cuối drop set\nA2 | Romanian Deadlift | 3 | 10 | 3-1-2 | 90s | | | Hông ra sau |`}
        style={{ minHeight: 180, fontFamily: 'ui-monospace, monospace', fontSize: 12.5, lineHeight: 1.7 }}
      />
      <div className="row-between">
        <span className="faint" style={{ fontSize: 12 }}>{count} bài tập</span>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
          {busy ? 'Đang lưu…' : saved ? <><IconCheck width={14} height={14} /> Đã lưu</> : 'Lưu ngày này'}
        </button>
      </div>
    </Card>
  )
}

export default function ProgramSection({ clientId }) {
  const { db } = useAuth()
  const { data: days, loading, reload } = useAsync(() => listPrograms(db, clientId), [db, clientId])
  const { data: phaseRows, reload: reloadPhases } = useAsync(() => listPhases(db, clientId), [db, clientId])
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [dayForm, setDayForm] = useState(null)
  const [phaseForm, setPhaseForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const phaseMap = {}
  ;(phaseRows || []).forEach((r) => { phaseMap[r.name] = r })

  // Derive unique phases from loaded days, ordered to match phase_rows'
  // order_index first (dated phases in the order the coach arranged them),
  // then anything left over that only exists as a bare tag on a day.
  const seenPhases = (days || []).map((d) => d.phase).filter(Boolean)
    .filter((ph, i, arr) => arr.indexOf(ph) === i)
  const phases = [
    ...(phaseRows || []).map((r) => r.name).filter((n) => seenPhases.includes(n)),
    ...seenPhases.filter((n) => !(phaseRows || []).some((r) => r.name === n)),
  ]
  const hasUnassigned = (days || []).some((d) => !d.phase)
  const allTabs = hasUnassigned ? [...phases, UNASSIGNED] : phases

  useEffect(() => {
    if (!selectedPhase && allTabs.length > 0) setSelectedPhase(allTabs[0])
  }, [days, phaseRows]) // eslint-disable-line react-hooks/exhaustive-deps

  async function savePhase() {
    if (!phaseForm?.name || !phaseForm?.start_date) return
    setBusy(true)
    try {
      const name = phaseForm.name.trim()
      const editing = phaseForm._editing
      if (editing && editing !== name) {
        await renamePhaseOnDays(db, clientId, editing, name)
        await deletePhaseRow(db, clientId, editing)
      }
      const orderIndex = phaseMap[editing || name]?.order_index ?? phases.length
      await upsertPhase(db, clientId, name, {
        start_date: phaseForm.start_date || null,
        weeks: phaseForm.weeks ? Number(phaseForm.weeks) : null,
        objective: phaseForm.objective?.trim() || null,
        order_index: orderIndex,
      })
      setSelectedPhase(name)
      setPhaseForm(null)
      reloadPhases()
      if (editing) reload()
    } catch (e) {
      showToast(e.message || 'Không lưu được, thử lại.')
    } finally { setBusy(false) }
  }

  async function movePhase(name, dir) {
    const list = [...phases]
    const from = list.indexOf(name)
    const to = from + dir
    if (from === -1 || to < 0 || to >= list.length) return
    list.splice(from, 1); list.splice(to, 0, name)
    setBusy(true)
    try { await reorderPhases(db, clientId, list); reloadPhases() }
    catch (e) { showToast(e.message || 'Không lưu được, thử lại.') }
    finally { setBusy(false) }
  }

  async function removePhase(name) {
    const dayCount = (days || []).filter((d) => d.phase === name).length
    const msg = dayCount > 0 ? `Xoá phase "${name}" và ${dayCount} ngày tập bên trong?` : `Xoá phase "${name}"?`
    if (!(await confirmDialog(msg, { title: 'Xoá phase', confirmLabel: 'Xoá phase', danger: true }))) return
    setBusy(true)
    try {
      if (dayCount > 0) await deletePhaseDays(db, clientId, name)
      await deletePhaseRow(db, clientId, name)
      const remaining = phases.filter((p) => p !== name)
      const idx = phases.indexOf(name)
      setSelectedPhase(remaining[idx] ?? remaining[idx - 1] ?? null)
      reloadPhases()
      if (dayCount > 0) reload()
    } catch (e) {
      showToast(e.message || 'Không xoá được, thử lại.')
    } finally { setBusy(false) }
  }

  async function saveDay() {
    if (!selectedPhase) return
    setBusy(true)
    try {
      await createProgramDay(db, clientId, {
        phase: selectedPhase === UNASSIGNED ? null : selectedPhase,
        week: null,
        workout_day: dayForm.workout_day || 'Workout',
        order_index: (days?.length || 0),
      })
      setDayForm(null); reload()
    } catch (e) {
      showToast(e.message || 'Không lưu được, thử lại.')
    } finally { setBusy(false) }
  }

  async function removeDay(id) {
    const ok = await confirmDialog('Xoá ngày tập này và toàn bộ bài tập trong đó?', { title: 'Xoá ngày tập', confirmLabel: 'Xoá ngày', danger: true })
    if (!ok) return
    try {
      await deleteProgramDay(db, id)
      reload()
    } catch (e) {
      showToast(e.message || 'Không xoá được, thử lại.')
    }
  }

  if (loading) return <InlineLoader />

  const phaseDays = (days || []).filter((d) =>
    selectedPhase === UNASSIGNED ? !d.phase : d.phase === selectedPhase
  )
  const customPhases = phases.filter((ph) => !PRESET_PHASES.includes(ph))
  const curPhaseRow = selectedPhase ? phaseMap[selectedPhase] : null
  const curPhaseEnd = curPhaseRow?.start_date && curPhaseRow?.weeks ? addDays(curPhaseRow.start_date, curPhaseRow.weeks * 7) : null

  return (
    <div className="stack">
      <div className="row-between" style={{ alignItems: 'center' }}>
        <Eyebrow muted>Giai đoạn</Eyebrow>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPhaseForm({ name: '', weeks: '', objective: '', start_date: localISODate() })}
        >
          <IconPlus width={15} height={15} /> Phase
        </button>
      </div>

      {allTabs.length === 0 ? (
        <Card style={{ background: 'var(--pf-surface-2)', textAlign: 'center', padding: 'var(--s5)' }}>
          <p className="muted" style={{ fontSize: 13 }}>Chưa có phase nào. Bấm <strong>＋ Phase</strong> để bắt đầu.</p>
        </Card>
      ) : (
        <div className="seg-tabs">
          {allTabs.map((ph) => (
            <div key={ph} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                onClick={() => setSelectedPhase(ph)}
                className={`seg-tab seg-tab-accent${ph === selectedPhase ? ' active' : ''}`}
              >
                {ph}{phaseMap[ph]?.weeks && ph !== UNASSIGNED ? ` · ${phaseMap[ph].weeks} tuần` : ''}
              </button>
              {ph === selectedPhase && ph !== UNASSIGNED && (
                <>
                  <button className="btn-quiet" title="Di chuyển lên" style={{ padding: '4px 5px', opacity: .5 }} onClick={() => movePhase(ph, -1)}><IconChevron width={13} height={13} style={{ transform: 'rotate(180deg)' }} /></button>
                  <button className="btn-quiet" title="Di chuyển xuống" style={{ padding: '4px 5px', opacity: .5 }} onClick={() => movePhase(ph, 1)}><IconChevron width={13} height={13} /></button>
                  <button
                    className="btn-quiet" title="Sửa phase" style={{ padding: '4px 6px', opacity: .55 }}
                    onClick={() => setPhaseForm({
                      _editing: ph, name: ph,
                      weeks: phaseMap[ph]?.weeks || '',
                      objective: phaseMap[ph]?.objective || '',
                      start_date: phaseMap[ph]?.start_date || localISODate(),
                    })}
                  ><IconEdit width={13} height={13} /></button>
                  <button className="btn-quiet" title="Xoá phase" style={{ padding: '4px 6px', opacity: .4, color: 'var(--pf-danger)' }} onClick={() => removePhase(ph)}><IconX width={13} height={13} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedPhase && (
        <>
          {(curPhaseRow?.objective || curPhaseRow?.start_date) && (
            <div style={{ borderLeft: '2px solid var(--pf-gold, var(--pf-accent))', paddingLeft: 12, marginTop: 4 }}>
              {curPhaseRow?.start_date && (
                <div className="eyebrow eyebrow-muted" style={{ marginBottom: 4 }}>
                  Thời gian: {formatDate(curPhaseRow.start_date)}{curPhaseEnd ? ` → ${formatDate(curPhaseEnd)}` : ''}
                </div>
              )}
              {curPhaseRow?.objective && (
                <>
                  <div className="eyebrow eyebrow-muted" style={{ marginBottom: 4 }}>Mục tiêu phase</div>
                  <p style={{ fontSize: 13, color: 'var(--pf-muted)', lineHeight: 1.6 }}>{curPhaseRow.objective}</p>
                </>
              )}
            </div>
          )}

          <div className="row-between" style={{ marginTop: 8 }}>
            <Eyebrow muted>Các ngày tập — {selectedPhase}</Eyebrow>
            <button className="btn btn-ghost btn-sm" onClick={() => setDayForm({ workout_day: '' })}>
              <IconPlus width={15} height={15} /> Thêm ngày
            </button>
          </div>

          <Card style={{ background: 'var(--pf-surface-2)' }}>
            <Eyebrow muted>Cách nhập (copy-paste như meal plan)</Eyebrow>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.7 }}>
              Mỗi dòng = 1 bài tập. Các cột ngăn nhau bằng dấu <strong style={{ color: 'var(--pf-accent)' }}>|</strong> theo thứ tự:
            </p>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--pf-accent)', marginTop: 6 }}>{HEADER}</div>
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Cột nào không có cứ để trống (vẫn giữ dấu |). Có thể dán thẳng từ Google Sheet (tab cũng được).</p>
          </Card>

          {phaseDays.length === 0 && (
            <Empty title={`Chưa có ngày tập nào trong ${selectedPhase}`} hint='Bấm "Thêm ngày" để bắt đầu.' />
          )}

          {phaseDays.map((d) => (
            <DayCard key={d.id} day={d} allDays={days} onChanged={reload} onDelete={removeDay} />
          ))}
        </>
      )}

      <Modal open={!!phaseForm} onClose={() => setPhaseForm(null)} title={phaseForm?._editing ? `Sửa phase — ${phaseForm._editing}` : 'Thêm phase'}>
        {phaseForm && (
          <div className="stack">
            <Field label="Tên phase">
              <Input
                list="new-phase-options"
                value={phaseForm.name}
                onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
                placeholder="Phase 1"
                autoFocus
              />
              <datalist id="new-phase-options">
                {PRESET_PHASES.map((ph) => <option key={ph} value={ph} />)}
                {customPhases.map((ph) => <option key={ph} value={ph} />)}
              </datalist>
            </Field>
            <Field label="Mục tiêu phase">
              <Textarea
                value={phaseForm.objective || ''}
                onChange={(e) => setPhaseForm({ ...phaseForm, objective: e.target.value })}
                placeholder="VD: Xây nền tảng kỹ thuật, tăng dần volume..."
                style={{ minHeight: 80 }}
              />
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Field label="Ngày bắt đầu">
                  <Input type="date" value={phaseForm.start_date || ''} onChange={(e) => setPhaseForm({ ...phaseForm, start_date: e.target.value })} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Tổng số tuần">
                  <Input type="number" min="1" value={phaseForm.weeks} onChange={(e) => setPhaseForm({ ...phaseForm, weeks: e.target.value })} placeholder="4" />
                </Field>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={savePhase} disabled={!phaseForm.name || !phaseForm.start_date || busy}>
              {busy ? 'Đang lưu…' : phaseForm._editing ? 'Lưu thay đổi' : 'Xác nhận'}
            </button>
            {!phaseForm.start_date && (
              <p className="faint" style={{ fontSize: 11.5, color: 'var(--pf-danger)', marginTop: -4 }}>
                Cần chọn ngày bắt đầu để hiện đúng thời gian phase cho học viên.
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!dayForm} onClose={() => setDayForm(null)} title={`Thêm ngày — ${selectedPhase}`}>
        {dayForm && (
          <div className="stack">
            <Field label="Tên ngày (VD: Day A · Lower Strength)">
              <Input value={dayForm.workout_day} onChange={(e) => setDayForm({ ...dayForm, workout_day: e.target.value })} autoFocus />
            </Field>
            <button className="btn btn-primary btn-block" onClick={saveDay} disabled={busy || !dayForm.workout_day}>
              {busy ? 'Đang lưu…' : 'Thêm ngày'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}

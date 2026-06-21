import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listPrograms, createProgramDay, deleteProgramDay, setDayExercises, updateProgramDay,
} from '../../../data/programs'
import { Card, Eyebrow, Field, Input, Textarea, Modal, Empty, InlineLoader } from '../../../components/ui/primitives'
import { IconPlus, IconTrash } from '../../../components/ui/Icons'

const COLS = ['group_label', 'exercise_name', 'sets', 'reps', 'tempo', 'rest', 'load', 'rpe', 'coaching_cue', 'notes']
const HEADER = 'Nhóm | Tên bài | Sets | Reps | Tempo | Nghỉ | Mức tạ | RPE | Cue | Ghi chú'
const PRESET_PHASES = ['Phase 1', 'Phase 2', 'Phase 3']

function phaseWeeksKey(clientId, phaseName) {
  return `pf_phase_weeks_${clientId}_${phaseName}`
}

function exercisesToText(list) {
  return (list || []).map((ex) =>
    COLS.map((c) => (ex[c] ?? '')).join(' | ')
  ).join('\n')
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
      await setDayExercises(db, day.id, parseText(text))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      onChanged?.()
    } finally { setBusy(false) }
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
              <span style={{ marginLeft: 6, opacity: 0.45, fontSize: 11 }}>✎ sửa</span>
            </div>
          </div>
        )}
        {!editing && <button className="btn-quiet" onClick={() => onDelete(day.id)} style={{ color: 'var(--pf-danger)' }}><IconTrash width={16} height={16} /></button>}
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
          {busy ? 'Đang lưu…' : saved ? '✓ Đã lưu' : 'Lưu ngày này'}
        </button>
      </div>
    </Card>
  )
}

export default function ProgramSection({ clientId }) {
  const { db } = useAuth()
  const { data: days, loading, reload } = useAsync(() => listPrograms(db, clientId), [db, clientId])
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [phaseWeeks, setPhaseWeeks] = useState({})
  const [dayForm, setDayForm] = useState(null)
  const [phaseForm, setPhaseForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const UNASSIGNED = '— Chưa phân phase'
  // Derive unique phases from loaded days
  const phases = (days || []).map((d) => d.phase).filter(Boolean)
    .filter((ph, i, arr) => arr.indexOf(ph) === i)
  const hasUnassigned = (days || []).some((d) => !d.phase)
  const allTabs = hasUnassigned ? [...phases, UNASSIGNED] : phases

  // Load phaseWeeks from localStorage whenever days change
  useEffect(() => {
    const map = {}
    phases.forEach((ph) => {
      const val = localStorage.getItem(phaseWeeksKey(clientId, ph))
      if (val) map[ph] = val
    })
    setPhaseWeeks(map)
  }, [days, clientId])

  // Auto-select first tab when days load
  useEffect(() => {
    if (!selectedPhase) {
      const first = (days || []).map((d) => d.phase).filter(Boolean)[0]
      if (first) setSelectedPhase(first)
      else if ((days || []).some((d) => !d.phase)) setSelectedPhase('— Chưa phân phase')
    }
  }, [days])

  function savePhase() {
    if (!phaseForm?.name) return
    const weeks = phaseForm.weeks ? String(phaseForm.weeks) : null
    if (weeks) {
      localStorage.setItem(phaseWeeksKey(clientId, phaseForm.name), weeks)
      setPhaseWeeks((prev) => ({ ...prev, [phaseForm.name]: weeks }))
    }
    setSelectedPhase(phaseForm.name)
    setPhaseForm(null)
  }

  async function saveDay() {
    if (!selectedPhase) return
    setBusy(true)
    try {
      await createProgramDay(db, clientId, {
        phase: selectedPhase,
        week: null,
        workout_day: dayForm.workout_day || 'Workout',
        order_index: (days?.length || 0),
      })
      setDayForm(null); reload()
    } finally { setBusy(false) }
  }

  async function removeDay(id) {
    if (!confirm('Xoá ngày tập này và toàn bộ bài tập trong đó?')) return
    await deleteProgramDay(db, id); reload()
  }

  if (loading) return <InlineLoader />

  const phaseDays = (days || []).filter((d) =>
    selectedPhase === UNASSIGNED ? !d.phase : d.phase === selectedPhase
  )
  const customPhases = phases.filter((ph) => !PRESET_PHASES.includes(ph))

  return (
    <div className="stack">
      {/* Phase selector row */}
      <div className="row-between" style={{ alignItems: 'center' }}>
        <Eyebrow muted>Giai đoạn</Eyebrow>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPhaseForm({ name: '', weeks: '' })}
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
            <button
              key={ph}
              onClick={() => setSelectedPhase(ph)}
              className={`seg-tab seg-tab-accent${ph === selectedPhase ? ' active' : ''}`}
            >
              {ph}{phaseWeeks[ph] && ph !== UNASSIGNED ? ` · ${phaseWeeks[ph]} tuần` : ''}
            </button>
          ))}
        </div>
      )}

      {/* Days section for selected phase */}
      {selectedPhase && (
        <>
          <div className="row-between" style={{ marginTop: 8 }}>
            <Eyebrow muted>Các ngày tập — {selectedPhase}</Eyebrow>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setDayForm({ workout_day: '' })}
            >
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

      {/* Modal: Add Phase */}
      <Modal open={!!phaseForm} onClose={() => setPhaseForm(null)} title="Thêm phase">
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
            <Field label="Tổng số tuần">
              <Input
                type="number"
                min="1"
                value={phaseForm.weeks}
                onChange={(e) => setPhaseForm({ ...phaseForm, weeks: e.target.value })}
                placeholder="4"
              />
            </Field>
            <button
              className="btn btn-primary btn-block"
              onClick={savePhase}
              disabled={!phaseForm.name}
            >
              Xác nhận
            </button>
          </div>
        )}
      </Modal>

      {/* Modal: Add Day */}
      <Modal open={!!dayForm} onClose={() => setDayForm(null)} title={`Thêm ngày — ${selectedPhase}`}>
        {dayForm && (
          <div className="stack">
            <Field label="Tên ngày (VD: Day A · Lower Strength)">
              <Input
                value={dayForm.workout_day}
                onChange={(e) => setDayForm({ ...dayForm, workout_day: e.target.value })}
                autoFocus
              />
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

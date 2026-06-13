import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listPrograms, createProgramDay, deleteProgramDay,
  addExercise, updateExercise, deleteExercise,
} from '../../../data/programs'
import { Card, Eyebrow, Field, Input, Textarea, Modal, Empty, InlineLoader } from '../../../components/ui/primitives'
import { IconPlus, IconTrash } from '../../../components/ui/Icons'

const EX_EMPTY = { exercise_name: '', group_label: '', sets: '', reps: '', tempo: '', rest: '', rpe: '', load: '', video_url: '', coaching_cue: '', notes: '' }

export default function ProgramSection({ clientId }) {
  const { db } = useAuth()
  const { data: days, loading, reload } = useAsync(() => listPrograms(db, clientId), [db, clientId])

  const [dayForm, setDayForm] = useState(null) // { phase, week, workout_day }
  const [exModal, setExModal] = useState(null) // { programId, ex }
  const [busy, setBusy] = useState(false)

  async function saveDay() {
    setBusy(true)
    try {
      await createProgramDay(db, clientId, {
        phase: dayForm.phase || null,
        week: dayForm.week ? Number(dayForm.week) : null,
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

  async function saveEx() {
    const ex = exModal.ex
    if (!ex.exercise_name.trim()) return
    setBusy(true)
    try {
      const payload = { ...ex, exercise_name: ex.exercise_name.trim() }
      if (ex.id) await updateExercise(db, ex.id, payload)
      else await addExercise(db, exModal.programId, { ...payload, order_index: exModal.order ?? 0 })
      setExModal(null); reload()
    } finally { setBusy(false) }
  }

  async function removeEx(id) {
    if (!confirm('Xoá bài tập này?')) return
    await deleteExercise(db, id); reload()
  }

  if (loading) return <InlineLoader />

  return (
    <div className="stack">
      <div className="row-between">
        <Eyebrow muted>Các ngày tập</Eyebrow>
        <button className="btn btn-ghost btn-sm" onClick={() => setDayForm({ phase: '', week: '', workout_day: '' })}>
          <IconPlus width={15} height={15} /> Thêm ngày
        </button>
      </div>

      {(!days || days.length === 0) && <Empty title="Chưa có ngày tập nào" />}

      {days?.map((d) => (
        <Card key={d.id} className="stack">
          <div className="row-between">
            <div>
              <div className="pf-display" style={{ fontSize: 18 }}>{d.workout_day}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {[d.phase, d.week && `Tuần ${d.week}`].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <button className="btn-quiet" onClick={() => removeDay(d.id)} style={{ color: 'var(--pf-danger)' }}><IconTrash width={16} height={16} /></button>
          </div>

          <div className="divider" />

          {(d.program_exercises || []).map((ex) => (
            <div key={ex.id} className="row-between" style={{ padding: '6px 0' }}>
              <div onClick={() => setExModal({ programId: d.id, ex: { ...ex } })} style={{ cursor: 'pointer', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.group_label ? `${ex.group_label} · ` : ''}{ex.exercise_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, ex.rpe && `RPE ${ex.rpe}`].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button className="btn-quiet" onClick={() => removeEx(ex.id)}><IconTrash width={15} height={15} /></button>
            </div>
          ))}

          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
            onClick={() => setExModal({ programId: d.id, order: d.program_exercises?.length || 0, ex: { ...EX_EMPTY } })}>
            <IconPlus width={15} height={15} /> Thêm bài tập
          </button>
        </Card>
      ))}

      {/* Add day modal */}
      <Modal open={!!dayForm} onClose={() => setDayForm(null)} title="Thêm ngày tập">
        {dayForm && (
          <div className="stack">
            <Field label="Tên ngày (VD: Workout A)"><Input value={dayForm.workout_day} onChange={(e) => setDayForm({ ...dayForm, workout_day: e.target.value })} /></Field>
            <div className="field-grid">
              <Field label="Giai đoạn (phase)"><Input value={dayForm.phase} onChange={(e) => setDayForm({ ...dayForm, phase: e.target.value })} placeholder="Foundation" /></Field>
              <Field label="Tuần"><Input type="number" value={dayForm.week} onChange={(e) => setDayForm({ ...dayForm, week: e.target.value })} /></Field>
            </div>
            <button className="btn btn-primary btn-block" onClick={saveDay} disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm ngày'}</button>
          </div>
        )}
      </Modal>

      {/* Add/edit exercise modal */}
      <Modal open={!!exModal} onClose={() => setExModal(null)} title={exModal?.ex?.id ? 'Sửa bài tập' : 'Thêm bài tập'}>
        {exModal && (
          <div className="stack">
            <div className="field-grid">
              <Field label="Nhóm (A1, A2…)"><Input value={exModal.ex.group_label || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, group_label: e.target.value.toUpperCase() } })} placeholder="A1" /></Field>
              <Field label="Tên bài tập"><Input value={exModal.ex.exercise_name} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, exercise_name: e.target.value } })} /></Field>
            </div>
            <div className="field-grid">
              <Field label="Sets"><Input value={exModal.ex.sets || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, sets: e.target.value } })} placeholder="3" /></Field>
              <Field label="Reps"><Input value={exModal.ex.reps || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, reps: e.target.value } })} placeholder="8-12" /></Field>
              <Field label="Tempo"><Input value={exModal.ex.tempo || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, tempo: e.target.value } })} placeholder="2010" /></Field>
              <Field label="Nghỉ"><Input value={exModal.ex.rest || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, rest: e.target.value } })} placeholder="90s" /></Field>
              <Field label="RPE"><Input value={exModal.ex.rpe || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, rpe: e.target.value } })} placeholder="8" /></Field>
              <Field label="Mức tạ"><Input value={exModal.ex.load || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, load: e.target.value } })} placeholder="20kg / BW" /></Field>
            </div>
            <Field label="Video URL"><Input value={exModal.ex.video_url || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, video_url: e.target.value } })} placeholder="https://…" /></Field>
            <Field label="Coaching cue"><Textarea value={exModal.ex.coaching_cue || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, coaching_cue: e.target.value } })} /></Field>
            <Field label="Ghi chú (drop set, kỹ thuật…)"><Textarea value={exModal.ex.notes || ''} onChange={(e) => setExModal({ ...exModal, ex: { ...exModal.ex, notes: e.target.value } })} placeholder="VD: set cuối drop set 2 lần" /></Field>
            <button className="btn btn-primary btn-block" onClick={saveEx} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu bài tập'}</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

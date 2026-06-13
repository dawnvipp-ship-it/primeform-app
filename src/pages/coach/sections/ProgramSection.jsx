import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useAsync } from '../../../hooks/useAsync'
import {
  listPrograms, createProgramDay, deleteProgramDay, setDayExercises,
} from '../../../data/programs'
import { Card, Eyebrow, Field, Input, Textarea, Modal, Empty, InlineLoader } from '../../../components/ui/primitives'
import { IconPlus, IconTrash } from '../../../components/ui/Icons'

// Column order for the paste box (pipe "|" or tab separated):
const COLS = ['group_label', 'exercise_name', 'sets', 'reps', 'tempo', 'rest', 'load', 'rpe', 'coaching_cue', 'notes']
const HEADER = 'Nhóm | Tên bài | Sets | Reps | Tempo | Nghỉ | Mức tạ | RPE | Cue | Ghi chú'

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
    // If only one field given, treat it as the exercise name.
    if (parts.length === 1) { ex.group_label = null; ex.exercise_name = parts[0] }
    return ex
  }).filter((ex) => ex.exercise_name)
}

function DayCard({ day, onChanged, onDelete }) {
  const { db } = useAuth()
  const [text, setText] = useState(exercisesToText(day.program_exercises))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const count = text.split('\n').filter((l) => l.trim()).length

  async function save() {
    setBusy(true); setSaved(false)
    try {
      await setDayExercises(db, day.id, parseText(text))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
      onChanged?.()
    } finally { setBusy(false) }
  }

  return (
    <Card className="stack">
      <div className="row-between">
        <div>
          <div className="pf-display" style={{ fontSize: 18 }}>{day.workout_day}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {[day.phase, day.week && `Tuần ${day.week}`].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        <button className="btn-quiet" onClick={() => onDelete(day.id)} style={{ color: 'var(--pf-danger)' }}><IconTrash width={16} height={16} /></button>
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
  const [dayForm, setDayForm] = useState(null)
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

  if (loading) return <InlineLoader />

  return (
    <div className="stack">
      <div className="row-between">
        <Eyebrow muted>Các ngày tập</Eyebrow>
        <button className="btn btn-ghost btn-sm" onClick={() => setDayForm({ phase: '', week: '', workout_day: '' })}>
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

      {(!days || days.length === 0) && <Empty title="Chưa có ngày tập nào" hint="Bấm “Thêm ngày” để bắt đầu." />}

      {days?.map((d) => <DayCard key={d.id} day={d} onChanged={reload} onDelete={removeDay} />)}

      <Modal open={!!dayForm} onClose={() => setDayForm(null)} title="Thêm ngày tập">
        {dayForm && (
          <div className="stack">
            <Field label="Tên ngày (VD: Day A · Lower Strength)"><Input value={dayForm.workout_day} onChange={(e) => setDayForm({ ...dayForm, workout_day: e.target.value })} /></Field>
            <div className="field-grid">
              <Field label="Giai đoạn (phase)"><Input value={dayForm.phase} onChange={(e) => setDayForm({ ...dayForm, phase: e.target.value })} placeholder="Foundation" /></Field>
              <Field label="Tuần"><Input type="number" value={dayForm.week} onChange={(e) => setDayForm({ ...dayForm, week: e.target.value })} /></Field>
            </div>
            <button className="btn btn-primary btn-block" onClick={saveDay} disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm ngày'}</button>
          </div>
        )}
      </Modal>
    </div>
  )
}

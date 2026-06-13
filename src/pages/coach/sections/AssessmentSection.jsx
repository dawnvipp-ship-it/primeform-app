import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getAssessment, upsertAssessment } from '../../../data/assessments'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader } from '../../../components/ui/primitives'

const EMPTY = {
  goal: '', weight: '', target_weight: '', body_fat: '', target_body_fat: '',
  injuries: '', posture_notes: '', mobility_notes: '', lifestyle_notes: '', coach_notes: '',
}

export default function AssessmentSection({ clientId }) {
  const { db } = useAuth()
  const [f, setF] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    let on = true
    getAssessment(db, clientId).then((a) => { if (on) { setF({ ...EMPTY, ...(a || {}) }); setLoading(false) } })
    return () => { on = false }
  }, [db, clientId])

  async function save() {
    setBusy(true); setSaved(false)
    const num = (v) => (v === '' || v == null ? null : Number(v))
    try {
      await upsertAssessment(db, clientId, {
        goal: f.goal || null,
        weight: num(f.weight), target_weight: num(f.target_weight),
        body_fat: num(f.body_fat), target_body_fat: num(f.target_body_fat),
        injuries: f.injuries || null, posture_notes: f.posture_notes || null,
        mobility_notes: f.mobility_notes || null, lifestyle_notes: f.lifestyle_notes || null,
        coach_notes: f.coach_notes || null,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setBusy(false) }
  }

  if (loading) return <InlineLoader />

  return (
    <div className="stack">
      <Card className="stack">
        <Eyebrow muted>Chỉ số</Eyebrow>
        <Field label="Mục tiêu"><Input value={f.goal} onChange={set('goal')} placeholder="VD: Giảm mỡ, tăng cơ" /></Field>
        <div className="field-grid">
          <Field label="Cân nặng (kg)"><Input type="number" value={f.weight} onChange={set('weight')} /></Field>
          <Field label="Cân nặng mục tiêu"><Input type="number" value={f.target_weight} onChange={set('target_weight')} /></Field>
          <Field label="Body fat (%)"><Input type="number" value={f.body_fat} onChange={set('body_fat')} /></Field>
          <Field label="Body fat mục tiêu"><Input type="number" value={f.target_body_fat} onChange={set('target_body_fat')} /></Field>
        </div>
      </Card>

      <Card className="stack">
        <Eyebrow muted>Ghi chú</Eyebrow>
        <Field label="Chấn thương"><Textarea value={f.injuries} onChange={set('injuries')} /></Field>
        <Field label="Tư thế"><Textarea value={f.posture_notes} onChange={set('posture_notes')} /></Field>
        <Field label="Vận động"><Textarea value={f.mobility_notes} onChange={set('mobility_notes')} /></Field>
        <Field label="Lối sống"><Textarea value={f.lifestyle_notes} onChange={set('lifestyle_notes')} /></Field>
        <Field label="Ghi chú HLV (khách cũng thấy)"><Textarea value={f.coach_notes} onChange={set('coach_notes')} /></Field>
      </Card>

      <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
        {busy ? 'Đang lưu…' : saved ? '✓ Đã lưu' : 'Lưu đánh giá'}
      </button>
    </div>
  )
}

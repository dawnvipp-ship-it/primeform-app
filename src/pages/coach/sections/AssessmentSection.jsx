import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getAssessment, upsertAssessment } from '../../../data/assessments'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader } from '../../../components/ui/primitives'
import { IconCheck } from '../../../components/ui/Icons'

const EMPTY = {
  goal: '', weight: '', target_weight: '', body_fat: '', target_body_fat: '', specific_goal: '',
  injuries: '', posture_notes: '', mobility_notes: '', lifestyle_notes: '', coach_notes: '',
  occupation: '', height: '', training_experience: '', weekly_availability: '', prior_pt_experience: '',
  equipment: '', meals_per_day: '', eating_habits: '', tracking_app: '', allergies: '',
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
        specific_goal: f.specific_goal || null,
        injuries: f.injuries || null, posture_notes: f.posture_notes || null,
        mobility_notes: f.mobility_notes || null, lifestyle_notes: f.lifestyle_notes || null,
        coach_notes: f.coach_notes || null,
        occupation: f.occupation || null, height: num(f.height),
        training_experience: f.training_experience || null, weekly_availability: f.weekly_availability || null,
        prior_pt_experience: f.prior_pt_experience || null, equipment: f.equipment || null,
        meals_per_day: num(f.meals_per_day),
        eating_habits: f.eating_habits || null, tracking_app: f.tracking_app || null,
        allergies: f.allergies || null,
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
        <Field label="Mục tiêu cụ thể"><Input value={f.specific_goal} onChange={set('specific_goal')} placeholder="VD: Giảm 8-10kg trong 3 tháng" /></Field>
      </Card>

      <Card className="stack">
        <Eyebrow muted>Hồ sơ intake</Eyebrow>
        <div className="field-grid">
          <Field label="Chiều cao (cm)"><Input type="number" value={f.height} onChange={set('height')} /></Field>
          <Field label="Nghề nghiệp"><Input value={f.occupation} onChange={set('occupation')} /></Field>
        </div>
        <div className="field-grid">
          <Field label="Kinh nghiệm tập luyện">
            <select className="input" value={f.training_experience} onChange={set('training_experience')}>
              <option value="">— Chưa chọn —</option>
              <option value="Chưa từng tập">Chưa từng tập</option>
              <option value="Tự tập (dưới 1 năm)">Tự tập (dưới 1 năm)</option>
              <option value="Trung bình (1-2 năm)">Trung bình (1-2 năm)</option>
              <option value="Có kinh nghiệm (2+ năm)">Có kinh nghiệm (2+ năm)</option>
            </select>
          </Field>
          <Field label="Có PT trước đây">
            <select className="input" value={f.prior_pt_experience} onChange={set('prior_pt_experience')}>
              <option value="">— Chưa chọn —</option>
              <option value="Chưa từng">Chưa từng</option>
              <option value="Đã có – online">Đã có – online</option>
              <option value="Đã có – offline">Đã có – offline</option>
              <option value="Đã có – cả hai">Đã có – cả hai</option>
            </select>
          </Field>
        </div>
        <Field label="Lịch rảnh trong tuần"><Input value={f.weekly_availability} onChange={set('weekly_availability')} placeholder="VD: T2/T4/T6 tối" /></Field>
        <div className="field-grid">
          <Field label="Thiết bị tập"><Input value={f.equipment} onChange={set('equipment')} /></Field>
          <Field label="Số bữa/ngày"><Input type="number" value={f.meals_per_day} onChange={set('meals_per_day')} /></Field>
        </div>
        <div className="field-grid">
          <Field label="Thói quen ăn uống"><Input value={f.eating_habits} onChange={set('eating_habits')} placeholder="VD: 50-50 ăn ngoài - nhà" /></Field>
          <Field label="Dùng app tracking"><Input value={f.tracking_app} onChange={set('tracking_app')} /></Field>
        </div>
        <Field label="Dị ứng / Kiêng ăn"><Textarea value={f.allergies} onChange={set('allergies')} /></Field>
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
        {busy ? 'Đang lưu…' : saved ? <><IconCheck width={14} height={14} /> Đã lưu</> : 'Lưu đánh giá'}
      </button>
    </div>
  )
}

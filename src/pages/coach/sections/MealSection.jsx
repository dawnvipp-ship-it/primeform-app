import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getMealPlan, upsertMealPlan } from '../../../data/mealPlans'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader } from '../../../components/ui/primitives'

export default function MealSection({ clientId }) {
  const { db } = useAuth()
  const [f, setF] = useState({ calories: '', protein: '', carbs: '', fat: '', general: '', training_day: '', rest_day: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    let on = true
    getMealPlan(db, clientId).then((p) => {
      if (!on) return
      const ms = p?.meal_structure || {}
      setF({
        calories: p?.calories ?? '', protein: p?.protein ?? '', carbs: p?.carbs ?? '', fat: p?.fat ?? '',
        general: typeof ms === 'string' ? ms : (ms.general || ''),
        training_day: ms.training_day || '', rest_day: ms.rest_day || '',
      })
      setLoading(false)
    })
    return () => { on = false }
  }, [db, clientId])

  async function save() {
    setBusy(true); setSaved(false)
    const int = (v) => (v === '' || v == null ? null : parseInt(v, 10))
    try {
      await upsertMealPlan(db, clientId, {
        calories: int(f.calories), protein: int(f.protein), carbs: int(f.carbs), fat: int(f.fat),
        meal_structure: { general: f.general || '', training_day: f.training_day || '', rest_day: f.rest_day || '' },
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setBusy(false) }
  }

  if (loading) return <InlineLoader />

  return (
    <div className="stack">
      <Card className="stack">
        <Eyebrow muted>Macros</Eyebrow>
        <div className="field-grid">
          <Field label="Calories"><Input type="number" value={f.calories} onChange={set('calories')} /></Field>
          <Field label="Protein (g)"><Input type="number" value={f.protein} onChange={set('protein')} /></Field>
          <Field label="Carbs (g)"><Input type="number" value={f.carbs} onChange={set('carbs')} /></Field>
          <Field label="Fat (g)"><Input type="number" value={f.fat} onChange={set('fat')} /></Field>
        </div>
      </Card>

      <Card className="stack">
        <Eyebrow muted>Cấu trúc bữa ăn</Eyebrow>
        <Field label="Tổng quan"><Textarea value={f.general} onChange={set('general')} /></Field>
        <Field label="Ngày tập"><Textarea value={f.training_day} onChange={set('training_day')} /></Field>
        <Field label="Ngày nghỉ"><Textarea value={f.rest_day} onChange={set('rest_day')} /></Field>
      </Card>

      <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
        {busy ? 'Đang lưu…' : saved ? '✓ Đã lưu' : 'Lưu kế hoạch'}
      </button>
    </div>
  )
}

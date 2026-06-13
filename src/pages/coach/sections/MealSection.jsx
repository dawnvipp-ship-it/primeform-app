import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getMealPlan, upsertMealPlan } from '../../../data/mealPlans'
import { Card, Eyebrow, Field, Input, Textarea, InlineLoader } from '../../../components/ui/primitives'

const DEFAULT_DAYS = [
  { label: 'T2 · REST', meals: '' },
  { label: 'T3 · TẬP A', meals: '' },
  { label: 'T4 · REST', meals: '' },
  { label: 'T5 · TẬP B', meals: '' },
  { label: 'T6 · REST', meals: '' },
  { label: 'T7 · TẬP C', meals: '' },
  { label: 'CN · REST', meals: '' },
]

export default function MealSection({ clientId }) {
  const { db } = useAuth()
  const [macros, setMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [supplements, setSupplements] = useState('')
  const [exchange, setExchange] = useState({ carb: '', protein: '', fat: '' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let on = true
    getMealPlan(db, clientId).then((p) => {
      if (!on) return
      const ms = p?.meal_structure || {}
      setMacros({ calories: p?.calories ?? '', protein: p?.protein ?? '', carbs: p?.carbs ?? '', fat: p?.fat ?? '' })
      setDays(ms.days?.length ? ms.days : DEFAULT_DAYS)
      setSupplements(ms.supplements || '')
      setExchange(ms.exchange || { carb: '', protein: '', fat: '' })
      setLoading(false)
    })
    return () => { on = false }
  }, [db, clientId])

  function setDay(i, key, val) {
    setDays(days.map((d, idx) => (idx === i ? { ...d, [key]: val } : d)))
  }

  async function save() {
    setBusy(true); setSaved(false)
    const int = (v) => (v === '' || v == null ? null : parseInt(v, 10))
    try {
      await upsertMealPlan(db, clientId, {
        calories: int(macros.calories), protein: int(macros.protein), carbs: int(macros.carbs), fat: int(macros.fat),
        meal_structure: { days, supplements, exchange },
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
          <Field label="Calories"><Input type="number" value={macros.calories} onChange={(e) => setMacros({ ...macros, calories: e.target.value })} /></Field>
          <Field label="Protein (g)"><Input type="number" value={macros.protein} onChange={(e) => setMacros({ ...macros, protein: e.target.value })} /></Field>
          <Field label="Carbs (g)"><Input type="number" value={macros.carbs} onChange={(e) => setMacros({ ...macros, carbs: e.target.value })} /></Field>
          <Field label="Fat (g)"><Input type="number" value={macros.fat} onChange={(e) => setMacros({ ...macros, fat: e.target.value })} /></Field>
        </div>
      </Card>

      <Card className="stack">
        <Eyebrow muted>Thực đơn 7 ngày</Eyebrow>
        <p className="muted" style={{ fontSize: 12 }}>
          Mỗi ngày dán các bữa, mỗi dòng 1 bữa. Mẹo: ghi “Bữa 1 (7:00): …” để app tự in đậm tên bữa.
        </p>
        {days.map((d, i) => (
          <div key={i} className="stack" style={{ gap: 8 }}>
            <Input value={d.label} onChange={(e) => setDay(i, 'label', e.target.value)} placeholder="Nhãn ngày (VD: T3 · TẬP A)" style={{ fontWeight: 600 }} />
            <Textarea value={d.meals} onChange={(e) => setDay(i, 'meals', e.target.value)} placeholder={'Bữa 1 (7:00): ...\nBữa 2 (12:00): ...'} style={{ minHeight: 96 }} />
          </div>
        ))}
      </Card>

      <Card className="stack">
        <Eyebrow muted>Supplement Protocol</Eyebrow>
        <p className="muted" style={{ fontSize: 12 }}>Mỗi dòng 1 supplement. Dùng dấu “|” để ngăn cột: Tên | Liều | Thời điểm | Lợi ích.</p>
        <Textarea value={supplements} onChange={(e) => setSupplements(e.target.value)} style={{ minHeight: 110 }}
          placeholder={'Vitamin D3 | 1000–2000 IU/ngày | Sáng cùng bữa ăn | Hormone, miễn dịch\nOmega-3 | 1–2g EPA+DHA | Trưa/tối | Não bộ, chống viêm'} />
      </Card>

      <Card className="stack">
        <Eyebrow muted>Bảng quy đổi món</Eyebrow>
        <p className="muted" style={{ fontSize: 12 }}>Mỗi dòng 1 món tương đương.</p>
        <div className="field-grid">
          <Field label="Carb"><Textarea value={exchange.carb} onChange={(e) => setExchange({ ...exchange, carb: e.target.value })} placeholder={'80g cơm trắng\n90g pasta'} style={{ minHeight: 120 }} /></Field>
          <Field label="Protein"><Textarea value={exchange.protein} onChange={(e) => setExchange({ ...exchange, protein: e.target.value })} placeholder={'120g ức gà\n140g cá hồi'} style={{ minHeight: 120 }} /></Field>
          <Field label="Fat"><Textarea value={exchange.fat} onChange={(e) => setExchange({ ...exchange, fat: e.target.value })} placeholder={'10g dầu olive\n15g hạnh nhân'} style={{ minHeight: 120 }} /></Field>
        </div>
      </Card>

      <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
        {busy ? 'Đang lưu…' : saved ? '✓ Đã lưu' : 'Lưu kế hoạch'}
      </button>
    </div>
  )
}

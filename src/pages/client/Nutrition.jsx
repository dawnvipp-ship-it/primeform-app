import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getMealPlan } from '../../data/mealPlans'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'

function Macro({ value, unit, label }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div className="pf-display" style={{ fontSize: 26 }}>{value ?? '—'}<span style={{ fontSize: 13 }} className="muted">{unit}</span></div>
      <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>{label}</div>
    </div>
  )
}

function MealBlock({ title, text }) {
  if (!text) return null
  return (
    <Card>
      <Eyebrow muted>{title}</Eyebrow>
      <p style={{ marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{text}</p>
    </Card>
  )
}

export default function Nutrition() {
  const { db } = useAuth()
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const plan = me ? await getMealPlan(db, me.id) : null
    return { plan }
  }, [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  const plan = data?.plan
  const ms = plan?.meal_structure || {}

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Dinh dưỡng</Eyebrow>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Kế hoạch ăn</h1>
      </div>

      {!plan ? (
        <Empty title="Chưa có kế hoạch dinh dưỡng" hint="HLV sẽ thiết kế dựa trên mục tiêu của bạn." />
      ) : (
        <>
          <Card>
            <div className="row" style={{ alignItems: 'stretch' }}>
              <Macro value={plan.calories} unit=" kcal" label="Calories" />
              <span style={{ width: 1, background: 'var(--pf-line)' }} />
              <Macro value={plan.protein} unit="g" label="Protein" />
              <span style={{ width: 1, background: 'var(--pf-line)' }} />
              <Macro value={plan.carbs} unit="g" label="Carbs" />
              <span style={{ width: 1, background: 'var(--pf-line)' }} />
              <Macro value={plan.fat} unit="g" label="Fat" />
            </div>
          </Card>

          <MealBlock title="Cấu trúc bữa ăn" text={typeof ms === 'string' ? ms : ms.general} />
          <MealBlock title="Ngày tập" text={ms.training_day} />
          <MealBlock title="Ngày nghỉ" text={ms.rest_day} />
        </>
      )}
    </div>
  )
}

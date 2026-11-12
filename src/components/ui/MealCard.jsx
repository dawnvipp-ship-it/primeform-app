import { Card, Eyebrow } from './primitives'

// One meal as its own card: time on top, each food on its own line. `meal` comes
// from parseMeals(), which only re-cuts the coach's text.
export function MealCard({ meal }) {
  return (
    <Card className="stack" style={{ gap: 10 }}>
      <div className="row-between">
        <span className="pf-display" style={{ fontSize: 18 }}>Bữa {meal.n}</span>
        {meal.time && <span className="tag">{meal.time}</span>}
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {meal.items.map((it, i) => (
          <div key={i} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pf-accent)', marginTop: 9, flexShrink: 0 }} />
            <div style={{ fontWeight: 500 }}>
              {it.main}
              {it.detail && <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> · {it.detail}</span>}
            </div>
          </div>
        ))}
        {meal.more.map((l, i) => <div key={`m${i}`} className="muted" style={{ fontSize: 12.5 }}>{l}</div>)}
      </div>
    </Card>
  )
}

// Daily macros divided by the number of meals that day. It is an average target,
// not what the listed foods add up to - the wording says so.
export function PerMealStrip({ avg, mealCount }) {
  if (!avg) return null
  const cells = [
    { v: avg.calories, u: 'kcal' }, { v: `${avg.protein}g`, u: 'Protein' },
    { v: `${avg.carbs}g`, u: 'Carb' }, { v: `${avg.fat}g`, u: 'Fat' },
  ]
  return (
    <Card className="stack" style={{ gap: 12 }}>
      <div>
        <Eyebrow muted>Trung bình mỗi bữa</Eyebrow>
        <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>Mục tiêu của ngày chia đều cho {mealCount} bữa, để bạn hình dung một bữa vừa đủ là bao nhiêu.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
        {cells.map((c) => (
          <div key={c.u}>
            <div className="pf-display" style={{ fontSize: 22 }}>~{c.v}</div>
            <div className="eyebrow eyebrow-muted" style={{ marginTop: 4, fontSize: 11 }}>{c.u}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}


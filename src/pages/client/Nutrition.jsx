import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getMealPlan } from '../../data/mealPlans'
import { SkeletonScreen, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import MacroRing from '../../components/ui/MacroRing'

const MACRO_LEGEND = [
  { key: 'protein', label: 'Protein', color: 'var(--pf-gold)' },
  { key: 'carbs', label: 'Carbs', color: 'var(--pf-ok)' },
  { key: 'fat', label: 'Fat', color: 'var(--pf-danger)' },
]

function MacroCard({ title, calories, protein, carbs, fat }) {
  return (
    <Card className="stack">
      <Eyebrow muted>{title}</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <MacroRing calories={calories} protein={protein} carbs={carbs} fat={fat} size={168} />
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 24 }}>
        {MACRO_LEGEND.map((m) => (
          <div key={m.key} style={{ textAlign: 'center' }}>
            <div className="row" style={{ gap: 6, justifyContent: 'center' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
              <span className="eyebrow eyebrow-muted">{m.label}</span>
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{({ protein, carbs, fat }[m.key]) ?? '—'}g</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Render a multi-line meal/text block; bold the part before the first ":" on each line.
function RichLines({ text }) {
  if (!text) return null
  return (
    <div className="stack" style={{ gap: 10 }}>
      {text.split('\n').filter((l) => l.trim()).map((line, i) => {
        const idx = line.indexOf(':')
        if (idx > 0 && idx < 30) {
          return (
            <div key={i}>
              <span style={{ fontWeight: 600, color: 'var(--pf-text)' }}>{line.slice(0, idx)}</span>
              <span className="muted">{line.slice(idx)}</span>
            </div>
          )
        }
        return <div key={i} className="muted">{line}</div>
      })}
    </div>
  )
}

function Supplements({ text }) {
  if (!text) return null
  const rows = text.split('\n').filter((l) => l.trim())
  return (
    <Card className="stack">
      <Eyebrow muted>Supplement Protocol</Eyebrow>
      <div className="stack" style={{ gap: 12 }}>
        {rows.map((line, i) => {
          const parts = line.split('|').map((s) => s.trim())
          return (
            <div key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--pf-line-soft)' : 'none', paddingBottom: 10 }}>
              <div style={{ fontWeight: 600 }}>{parts[0]}</div>
              {parts.length > 1 && <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{parts.slice(1).join(' · ')}</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ExchangeTable({ exchange }) {
  if (!exchange) return null
  const cols = [
    { key: 'carb', label: 'Carb' },
    { key: 'protein', label: 'Protein' },
    { key: 'fat', label: 'Fat' },
  ].filter((c) => (exchange[c.key] || '').trim())
  if (cols.length === 0) return null
  return (
    <Card className="stack">
      <Eyebrow muted>Bảng quy đổi món</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 12 }}>
        {cols.map((c) => (
          <div key={c.key}>
            <div className="eyebrow eyebrow-muted" style={{ marginBottom: 8 }}>{c.label}</div>
            <div className="stack" style={{ gap: 6 }}>
              {exchange[c.key].split('\n').filter((l) => l.trim()).map((l, i) => (
                <div key={i} className="muted" style={{ fontSize: 12.5 }}>{l}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Nutrition() {
  const { db } = useAuth()
  const [active, setActive] = useState(0)
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const plan = me ? await getMealPlan(db, me.id) : null
    return { plan }
  }, [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  const plan = data?.plan
  const ms = plan?.meal_structure || {}
  const days = (ms.days || []).filter((d) => (d.label || d.meals))
  const cur = days[active]

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Dinh dưỡng</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Kế hoạch ăn</h1>
      </div>

      {!plan ? (
        <Empty title="Chưa có kế hoạch dinh dưỡng" hint="HLV sẽ thiết kế dựa trên mục tiêu của bạn." />
      ) : (
        <>
          {ms.notes && (
            <Card style={{ borderLeft: '2px solid var(--pf-accent)' }}>
              <Eyebrow muted>Ghi chú từ HLV</Eyebrow>
              <div style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{ms.notes}</div>
            </Card>
          )}

          <MacroCard title="Ngày tập" calories={plan.calories} protein={plan.protein} carbs={plan.carbs} fat={plan.fat} />

          {ms.macros_rest && (ms.macros_rest.calories || ms.macros_rest.protein) && (
            <MacroCard
              title="Ngày nghỉ"
              calories={ms.macros_rest.calories} protein={ms.macros_rest.protein}
              carbs={ms.macros_rest.carbs} fat={ms.macros_rest.fat}
            />
          )}

          {days.length > 0 && (
            <>
              <Eyebrow muted>Thực đơn 7 ngày</Eyebrow>
              <div className="seg-tabs">
                {days.map((d, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`seg-tab${i === active ? ' active' : ''}`}>
                    {d.label || `Ngày ${i + 1}`}
                  </button>
                ))}
              </div>
              {cur && <Card><RichLines text={cur.meals} /></Card>}
            </>
          )}

          {/* Backward-compat: simple template if no 7-day grid */}
          {days.length === 0 && (ms.training_day || ms.rest_day || ms.general) && (
            <>
              {ms.general && <Card><Eyebrow muted>Cấu trúc</Eyebrow><div style={{ marginTop: 10 }}><RichLines text={ms.general} /></div></Card>}
              {ms.training_day && <Card><Eyebrow muted>Ngày tập</Eyebrow><div style={{ marginTop: 10 }}><RichLines text={ms.training_day} /></div></Card>}
              {ms.rest_day && <Card><Eyebrow muted>Ngày nghỉ</Eyebrow><div style={{ marginTop: 10 }}><RichLines text={ms.rest_day} /></div></Card>}
            </>
          )}

          <Supplements text={ms.supplements} />
          <ExchangeTable exchange={ms.exchange} />
        </>
      )}
    </div>
  )
}

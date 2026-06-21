import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getMealPlan } from '../../data/mealPlans'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'

function Macro({ value, unit, label }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div className="pf-display" style={{ fontSize: 24 }}>{value ?? '—'}<span style={{ fontSize: 12 }} className="muted">{unit}</span></div>
      <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>{label}</div>
    </div>
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
              <span style={{ fontWeight: 600, color: 'var(--pf-accent)' }}>{line.slice(0, idx)}</span>
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
            <div className="eyebrow" style={{ marginBottom: 8 }}>{c.label}</div>
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

  if (loading) return <div className="screen"><InlineLoader /></div>
  const plan = data?.plan
  const ms = plan?.meal_structure || {}
  const days = (ms.days || []).filter((d) => (d.label || d.meals))
  const cur = days[active]

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

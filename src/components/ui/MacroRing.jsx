import { useEffect, useState } from 'react'

// Same visual language as SessionRing (thin arc over a track, big numeral
// center) but split into 3 segments by calorie contribution instead of one
// used/remaining fraction - protein/carbs at 4 kcal/g, fat at 9 kcal/g.
const SEGMENTS = [
  { key: 'protein', color: 'var(--pf-gold)', kcalPerG: 4 },
  { key: 'carbs', color: 'var(--pf-ok)', kcalPerG: 4 },
  { key: 'fat', color: 'var(--pf-danger)', kcalPerG: 9 },
]

export default function MacroRing({ calories, protein, carbs, fat, size = 200 }) {
  const stroke = 10
  const r = (size - stroke) / 2 - 4
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r

  const grams = { protein: protein || 0, carbs: carbs || 0, fat: fat || 0 }
  const contributions = SEGMENTS.map((s) => ({ ...s, kcal: grams[s.key] * s.kcalPerG }))
  const totalKcal = contributions.reduce((sum, s) => sum + s.kcal, 0) || 1

  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(id)
  }, [])

  let offset = 0
  const arcs = contributions.map((s) => {
    const len = animated ? (s.kcal / totalKcal) * circ : 0
    const arc = { ...s, len, offset }
    offset += len
    return arc
  })

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--pf-line)" strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={a.color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${a.len} ${circ}`}
            strokeDashoffset={-a.offset}
            style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1), stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ring-num" style={{ fontSize: size * 0.22 }}>{calories ?? '—'}</div>
        <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>kcal</div>
      </div>
    </div>
  )
}

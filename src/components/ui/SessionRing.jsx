// Signature element: sessions rendered like a watch face.
// Thin gold arc over a faint track, large numeral at center (Inter Tight).

import { useEffect, useState } from 'react'

export default function SessionRing({ total = 0, used = 0, size = 220, label = 'còn lại' }) {
  const remaining = Math.max(total - used, 0)
  const pct = total > 0 ? used / total : 0
  const stroke = 6
  const r = (size - stroke) / 2 - 6
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  // Leave a small gap at the bottom (like a gauge) — sweep 300°.
  const sweep = 0.83
  const trackLen = circ * sweep

  // Starts at 0 and animates to the real value on mount, via the arc's own
  // CSS transition below - a plain render with the final value baked in
  // never actually sweeps, since there's no prior frame to transition from.
  const [animatedPct, setAnimatedPct] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  const usedLen = trackLen * animatedPct
  const rotation = 90 + (1 - sweep) * 180 // center the gap at the bottom

  return (
    <div className="ring-wrap">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }}>
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--pf-line)" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${trackLen} ${circ}`}
          />
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--pf-accent)" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${usedLen} ${circ}`}
            style={{ transition: 'stroke-dasharray .8s cubic-bezier(.2,.8,.2,1)' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div className="ring-num" style={{ fontSize: size * 0.32 }}>{remaining}</div>
          <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>{label}</div>
        </div>
      </div>
      <div className="row" style={{ marginTop: 18, gap: 28 }}>
        <Mini value={total} label="trọn gói" />
        <span style={{ width: 1, height: 26, background: 'var(--pf-line)' }} />
        <Mini value={used} label="đã tập" />
      </div>
    </div>
  )
}

function Mini({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
      <div className="eyebrow eyebrow-muted" style={{ marginTop: 4 }}>{label}</div>
    </div>
  )
}

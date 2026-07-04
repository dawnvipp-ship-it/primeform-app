import { useState } from 'react'

// Drag the handle to reveal more/less of the "after" photo over "before".
// Plain range input driving a clip-path - no drag-gesture library needed,
// and it's natively touch-friendly on mobile.
export default function BeforeAfterSlider({ beforeUrl, beforeLabel, afterUrl, afterLabel }) {
  const [pos, setPos] = useState(50)

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--pf-line)', background: 'var(--pf-surface-2)' }}>
        <img src={beforeUrl} alt={beforeLabel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={afterUrl} alt={afterLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: 'var(--pf-accent)', transform: 'translateX(-1px)' }} />
        <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(11,11,11,.6)', color: 'var(--pf-text)' }}>{afterLabel}</span>
        <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(11,11,11,.6)', color: 'var(--pf-text)' }}>{beforeLabel}</span>
      </div>
      <input
        type="range" min={0} max={100} value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--pf-accent)' }}
      />
    </div>
  )
}

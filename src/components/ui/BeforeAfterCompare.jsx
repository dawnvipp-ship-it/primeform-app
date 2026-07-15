// Two photos side by side. A slide-to-reveal overlay only reads well when
// both shots are framed identically (same distance, pose, crop) - clients
// photograph themselves at home/studio across weeks, so alignment varies
// and an overlay can silently mash two unrelated-looking photos together.
// Side by side stays legible regardless of framing.
export default function BeforeAfterCompare({ beforeUrl, beforeLabel, afterUrl, afterLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[{ url: beforeUrl, label: beforeLabel }, { url: afterUrl, label: afterLabel }].map(({ url, label }, i) => (
        <div key={i} className="stack" style={{ gap: 6 }}>
          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--pf-line)', background: 'var(--pf-surface-2)' }}>
            {url && <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div className="eyebrow eyebrow-muted" style={{ textAlign: 'center' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export function Eyebrow({ children, muted }) {
  return <div className={muted ? 'eyebrow eyebrow-muted' : 'eyebrow'}>{children}</div>
}

export function Card({ children, className = '', ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>
}

export function Loader({ label }) {
  return (
    <div className="center-screen" style={{ flexDirection: 'column', gap: 14 }}>
      <div className="spinner" />
      {label && <div className="faint" style={{ fontSize: 13 }}>{label}</div>}
    </div>
  )
}

export function InlineLoader() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>
}

export function Empty({ title, hint }) {
  return (
    <div className="empty">
      <div className="pf-display" style={{ fontSize: 20, color: 'var(--pf-muted)' }}>{title}</div>
      {hint && <div style={{ marginTop: 8, fontSize: 13 }}>{hint}</div>}
    </div>
  )
}

export function Tag({ children, accent }) {
  return <span className={accent ? 'tag tag-accent' : 'tag'}>{children}</span>
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Input(props) { return <input className="input" {...props} /> }
export function Textarea(props) { return <textarea className="textarea" {...props} /> }

// A label/value row used across read-only views.
export function KV({ label, value }) {
  return (
    <div className="kv">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value ?? '—'}</span>
    </div>
  )
}

// A large editorial stat (number + caption).
export function Stat({ value, label, size = 40 }) {
  return (
    <div>
      <div className="pf-display" style={{ fontSize: size, lineHeight: 1 }}>{value}</div>
      <div className="eyebrow eyebrow-muted" style={{ marginTop: 6 }}>{label}</div>
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          width: '100%', maxWidth: 560, background: 'var(--pf-surface)',
          border: '1px solid var(--pf-line)', borderRadius: '16px 16px 0 0',
          padding: 24, maxHeight: '88dvh', overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        {title && (
          <div className="row-between" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 20 }}>{title}</h3>
            <button className="btn-quiet" onClick={onClose} style={{ fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

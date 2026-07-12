import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { IconX } from './Icons'

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
  // Portalled to document.body: a fade-in ancestor (any page root using the
  // .fade-in mount animation, e.g. every `.screen`) creates a transform
  // during its animation, which makes descendant `position: fixed` elements
  // resolve against that ancestor's box instead of the real viewport - the
  // modal would end up clipped above the bottom nav instead of covering it.
  // Rendering outside the component tree sidesteps that entirely.
  // Layout (bottom-sheet on phone, centered dialog on desktop) lives in the
  // .modal-backdrop/.modal-panel CSS classes so it can respond to viewport
  // width via a media query - inline styles can't.
  return createPortal(
    <div onClick={onClose} className="modal-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="modal-panel fade-in">
        {title && (
          <div className="row-between" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 20 }}>{title}</h3>
            <button className="btn-quiet" onClick={onClose} aria-label="Đóng" style={{ padding: 6 }}><IconX width={18} height={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}

// ---------- Toast (fire-and-forget save/error notifications) ----------
// Module-level pub-sub instead of context: showToast() can be called from
// any data/save function without wiring a provider through every page.
let toastListeners = []
export function showToast(message) {
  toastListeners.forEach((fn) => fn(message))
}

export function ToastHost() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const handler = (message) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter((f) => f !== handler) }
  }, [])
  if (toasts.length === 0) return null
  return createPortal(
    <div style={{
      position: 'fixed', left: '50%', bottom: 'calc(var(--bottomnav-h) + 16px)', transform: 'translateX(-50%)',
      zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none',
    }}>
      {toasts.map((t) => <div key={t.id} className="toast fade-in">{t.message}</div>)}
    </div>,
    document.body
  )
}

// ---------- Confirm dialog (Promise-based replacement for window.confirm) ----------
let confirmResolve = null
let confirmListeners = []
export function confirmDialog(message, opts = {}) {
  return new Promise((resolve) => {
    confirmResolve = resolve
    confirmListeners.forEach((fn) => fn({ message, ...opts }))
  })
}

export function ConfirmHost() {
  const [state, setState] = useState(null)
  useEffect(() => {
    const handler = (s) => setState(s)
    confirmListeners.push(handler)
    return () => { confirmListeners = confirmListeners.filter((f) => f !== handler) }
  }, [])
  function settle(value) {
    setState(null)
    confirmResolve?.(value)
    confirmResolve = null
  }
  return (
    <Modal open={!!state} onClose={() => settle(false)} title={state?.title || 'Xác nhận'}>
      {state && (
        <div className="stack">
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pf-muted)' }}>{state.message}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => settle(false)}>Huỷ</button>
            <button className={`btn ${state.danger ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 1 }} onClick={() => settle(true)}>
              {state.confirmLabel || 'Xác nhận'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---------- Skeleton loading blocks (replaces the bare spinner mid-page) ----------
export function SkeletonBlock({ height = 16, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card stack" style={{ gap: 10 }}>
      <SkeletonBlock height={12} width="35%" />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock key={i} height={14} width={i === lines - 1 ? '60%' : '90%'} />
      ))}
    </div>
  )
}

export function SkeletonScreen({ cards = 3 }) {
  return (
    <div className="stack">
      {Array.from({ length: cards }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

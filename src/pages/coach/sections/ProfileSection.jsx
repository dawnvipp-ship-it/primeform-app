import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { updateClient } from '../../../data/clients'
import { Card, Eyebrow, Field, Input } from '../../../components/ui/primitives'

export default function ProfileSection({ client, onSaved }) {
  const { db } = useAuth()
  const [f, setF] = useState({
    full_name: client.full_name || '',
    phone: client.phone || '',
    email: client.email || '',
    total_sessions: client.total_sessions ?? 0,
    used_sessions: client.used_sessions ?? 0,
    active: client.active,
  })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function save() {
    setBusy(true); setErr(''); setSaved(false)
    const total = Number(f.total_sessions) || 0
    const used = Number(f.used_sessions) || 0
    if (used > total) { setErr('Số buổi đã tập không thể lớn hơn trọn gói.'); setBusy(false); return }
    try {
      await updateClient(db, client.id, {
        full_name: f.full_name.trim(),
        phone: f.phone.trim() || null,
        email: f.email.trim() || null,
        total_sessions: total,
        used_sessions: used,
        active: f.active,
      })
      setSaved(true); onSaved?.()
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { setErr(e.message || 'Lỗi lưu.') } finally { setBusy(false) }
  }

  const remaining = (Number(f.total_sessions) || 0) - (Number(f.used_sessions) || 0)

  return (
    <div className="stack">
      <Card className="stack">
        <Eyebrow muted>Thông tin</Eyebrow>
        <Field label="Họ tên"><Input value={f.full_name} onChange={set('full_name')} /></Field>
        <div className="field-grid">
          <Field label="SĐT"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
        </div>
        <label className="row" style={{ gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          <span style={{ fontSize: 14 }}>Đang hoạt động (mã truy cập còn hiệu lực)</span>
        </label>
      </Card>

      <Card className="stack">
        <Eyebrow muted>Buổi tập</Eyebrow>
        <div className="field-grid">
          <Field label="Trọn gói"><Input type="number" value={f.total_sessions} onChange={set('total_sessions')} /></Field>
          <Field label="Đã tập"><Input type="number" value={f.used_sessions} onChange={set('used_sessions')} /></Field>
        </div>
        <div className="muted" style={{ fontSize: 13 }}>Còn lại: <strong style={{ color: 'var(--pf-accent)' }}>{remaining} buổi</strong> (tự tính)</div>
      </Card>

      {err && <div style={{ color: 'var(--pf-danger)', fontSize: 13 }}>{err}</div>}
      <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>
        {busy ? 'Đang lưu…' : saved ? '✓ Đã lưu' : 'Lưu thay đổi'}
      </button>
    </div>
  )
}

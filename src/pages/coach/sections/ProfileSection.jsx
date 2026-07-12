import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { updateClient, deleteClient } from '../../../data/clients'
import { COACHES } from '../../../data/coaches'
import { Card, Eyebrow, Field, Input, confirmDialog, showToast } from '../../../components/ui/primitives'
import { IconCheck } from '../../../components/ui/Icons'

export default function ProfileSection({ client, onSaved }) {
  const { db } = useAuth()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [f, setF] = useState({
    full_name: client.full_name || '',
    phone: client.phone || '',
    email: client.email || '',
    total_sessions: client.total_sessions ?? 0,
    used_sessions: client.used_sessions ?? 0,
    active: client.active,
    coach: client.coach || '',
    birth_year: client.birth_year ?? '',
    gender: client.gender || '',
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
        coach: f.coach || null,
        birth_year: f.birth_year === '' ? null : Number(f.birth_year),
        gender: f.gender || null,
      })
      setSaved(true); onSaved?.()
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { setErr(e.message || 'Lỗi lưu.') } finally { setBusy(false) }
  }

  async function remove() {
    const ok = await confirmDialog(`Xoá hồ sơ "${client.full_name}"? Toàn bộ dữ liệu (giáo án, dinh dưỡng, tiến độ) sẽ mất vĩnh viễn.`, {
      title: 'Xoá hồ sơ khách hàng', confirmLabel: 'Xoá hồ sơ', danger: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      await deleteClient(db, client.id)
      navigate('/coach')
    } catch (e) {
      showToast(e.message || 'Lỗi xoá hồ sơ')
      setDeleting(false)
    }
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
        <div className="field-grid">
          <Field label="Năm sinh"><Input type="number" value={f.birth_year} onChange={set('birth_year')} /></Field>
          <Field label="Giới tính">
            <select className="input" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
              <option value="">— Chưa chọn —</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </Field>
        </div>
        <Field label="HLV phụ trách">
          <select className="input" value={f.coach} onChange={(e) => setF({ ...f, coach: e.target.value })}>
            <option value="">— Chưa gán —</option>
            {COACHES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
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
        {busy ? 'Đang lưu…' : saved ? <><IconCheck width={16} height={16} /> Đã lưu</> : 'Lưu thay đổi'}
      </button>

      <Card className="stack" style={{ borderColor: 'rgba(196,130,111,.3)' }}>
        <Eyebrow muted>Khu vực nguy hiểm</Eyebrow>
        <p className="muted" style={{ fontSize: 13 }}>Xoá hồ sơ sẽ xoá vĩnh viễn toàn bộ dữ liệu của khách này, không thể hoàn tác.</p>
        <button className="btn btn-danger" onClick={remove} disabled={deleting}>
          {deleting ? 'Đang xoá…' : 'Xoá hồ sơ'}
        </button>
      </Card>
    </div>
  )
}

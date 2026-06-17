import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listClients, createClient, deleteClient } from '../../data/clients'
import { InlineLoader, Eyebrow, Card, Empty, Modal, Field, Input } from '../../components/ui/primitives'
import { IconPlus, IconChevron, IconTrash } from '../../components/ui/Icons'

function genCode(name) {
  const base = (name || 'PF').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PF'
  const n = Math.floor(1000 + Math.random() * 9000)
  return `${base}-${n}`
}

export default function ClientList() {
  const { db } = useAuth()
  const navigate = useNavigate()
  const { data, loading, reload } = useAsync(() => listClients(db), [db])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', client_code: '', phone: '', email: '', total_sessions: 72 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')

  const filtered = (data || []).filter((c) => {
    const q = query.toLowerCase()
    return !q || c.full_name?.toLowerCase().includes(q) || c.client_code?.toLowerCase().includes(q)
  })

  function openModal() {
    setForm({ full_name: '', client_code: genCode(''), phone: '', email: '', total_sessions: 72 })
    setErr(''); setOpen(true)
  }

  async function save() {
    if (!form.full_name.trim() || !form.client_code.trim()) { setErr('Cần tên và mã truy cập.'); return }
    setBusy(true); setErr('')
    try {
      const created = await createClient(db, {
        full_name: form.full_name.trim(),
        client_code: form.client_code.trim().toUpperCase(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        total_sessions: Number(form.total_sessions) || 0,
      })
      setOpen(false)
      navigate(`/coach/client/${created.id}`)
    } catch (e) {
      setErr(e.message?.includes('duplicate') ? 'Mã truy cập đã tồn tại.' : (e.message || 'Lỗi tạo khách.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="coach-screen stack">
      <div className="row-between">
        <div>
          <Eyebrow>Khách hàng</Eyebrow>
          <h1 style={{ fontSize: 26, marginTop: 6 }}>{data?.length || 0} hồ sơ</h1>
        </div>
        <button className="btn btn-primary" onClick={openModal}><IconPlus width={16} height={16} /> Khách mới</button>
      </div>

      {!loading && data?.length > 0 && (
        <Input
          placeholder="Tìm theo tên hoặc mã…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {loading ? <InlineLoader /> : (data?.length === 0 ? (
        <Empty title="Chưa có khách hàng" hint="Tạo hồ sơ đầu tiên để bắt đầu." />
      ) : filtered.length === 0 ? (
        <Empty title="Không tìm thấy khách hàng" hint={`Không có kết quả cho "${query}"`} />
      ) : (
        <Card className="card-flush">
          {filtered.map((c) => (
            <div key={c.id} className="row-between" onClick={() => navigate(`/coach/client/${c.id}`)}
              style={{ padding: '16px 18px', borderBottom: '1px solid var(--pf-line-soft)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {c.client_code} · còn {c.remaining_sessions}/{c.total_sessions} buổi
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn-quiet"
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (!confirm(`Xoá hồ sơ "${c.full_name}"? Hành động này không thể hoàn tác.`)) return
                    try { await deleteClient(db, c.id); reload() }
                    catch (err) { alert(err.message || 'Lỗi xoá hồ sơ') }
                  }}
                  style={{ color: 'var(--pf-danger, #e05c5c)' }}
                >
                  <IconTrash width={15} height={15} />
                </button>
                <span className="faint"><IconChevron /></span>
              </div>
            </div>
          ))}
        </Card>
      )))}

      <Modal open={open} onClose={() => setOpen(false)} title="Tạo khách hàng">
        <div className="stack">
          <Field label="Họ tên"><Input value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value, client_code: form.client_code || genCode(e.target.value) })} /></Field>
          <Field label="Mã truy cập">
            <div className="row">
              <Input value={form.client_code} onChange={(e) => setForm({ ...form, client_code: e.target.value.toUpperCase() })} />
              <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, client_code: genCode(form.full_name) })}>Tạo mã</button>
            </div>
          </Field>
          <div className="field-grid">
            <Field label="SĐT"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Số buổi"><Input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} /></Field>
          </div>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {err && <div style={{ color: 'var(--pf-danger)', fontSize: 13 }}>{err}</div>}
          <button className="btn btn-primary btn-block" onClick={save} disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo hồ sơ'}</button>
        </div>
      </Modal>
    </div>
  )
}

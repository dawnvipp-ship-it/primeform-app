import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CoachLogin() {
  const { loginCoach } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (busy) return
    setBusy(true); setErr('')
    try {
      await loginCoach(email.trim(), password)
      navigate('/coach', { replace: true })
    } catch (e) {
      setErr(e.message || 'Đăng nhập thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <div className="fade-in" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Huấn luyện viên</div>
          <div className="pf-display" style={{ fontSize: 34 }}>Prime Form</div>
        </div>

        <div className="stack">
          <input className="input" type="email" placeholder="Email" value={email}
            autoCapitalize="none" onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Mật khẩu" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>

        {err && <div style={{ color: 'var(--pf-danger)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{err}</div>}

        <button className="btn btn-primary btn-block" onClick={submit} disabled={busy} style={{ marginTop: 16 }}>
          {busy ? 'Đang vào…' : 'Đăng nhập'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn-quiet" style={{ fontSize: 12 }} onClick={() => navigate('/')}>← Cổng khách hàng</button>
        </div>
      </div>
    </div>
  )
}

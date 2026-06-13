import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'
import heroBg from '../assets/studio-hero.jpg'

export default function Login() {
  const { loginClient } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!code.trim() || busy) return
    setBusy(true); setErr('')
    try {
      await loginClient(code)
      navigate('/app', { replace: true })
    } catch (e) {
      setErr(e.message || 'Mã không hợp lệ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Studio photo, darkened */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <img src={heroBg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.32 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,11,11,.65) 0%, rgba(11,11,11,.82) 55%, #0B0B0B 100%)' }} />
      </div>

      <div className="fade-in" style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src={logo} alt="Prime Form" style={{ width: 64, height: 'auto', margin: '0 auto 18px', display: 'block' }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>Private Training</div>
          <div className="pf-display" style={{ fontSize: 42, letterSpacing: '-0.02em' }}>Prime Form</div>
          <div className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            Nhập mã truy cập để xem chương trình của bạn.
          </div>
        </div>

        <input
          className="input"
          placeholder="MÃ TRUY CẬP"
          value={code}
          autoCapitalize="characters"
          autoCorrect="off"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={{ textAlign: 'center', letterSpacing: '0.18em', fontSize: 16 }}
        />

        {err && (
          <div style={{ color: 'var(--pf-danger)', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{err}</div>
        )}

        <button className="btn btn-primary btn-block" onClick={submit} disabled={busy} style={{ marginTop: 16 }}>
          {busy ? 'Đang mở…' : 'Vào chương trình'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button className="btn-quiet" style={{ fontSize: 12, letterSpacing: '.08em' }} onClick={() => navigate('/coach/login')}>
            Đăng nhập huấn luyện viên
          </button>
        </div>
      </div>
    </div>
  )
}

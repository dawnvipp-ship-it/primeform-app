import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconLogout } from '../../components/ui/Icons'
import logo from '../../assets/logo.png'

export default function CoachLayout() {
  const { logout, coachUser } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(11,11,11,.86)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--pf-line)',
      }}>
        <div className="row-between" style={{ maxWidth: 960, margin: '0 auto', padding: '14px 16px' }}>
          <div className="row" style={{ gap: 10, cursor: 'pointer' }} onClick={() => navigate('/coach')}>
            <img src={logo} alt="" style={{ width: 22, height: 'auto' }} />
            <span className="pf-display" style={{ fontSize: 20 }}>Prime Form</span>
            <span className="tag">Coach</span>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <span className="muted" style={{ fontSize: 12 }}>{coachUser?.email}</span>
            <button className="btn-quiet" onClick={async () => { await logout(); navigate('/'); }} title="Đăng xuất"><IconLogout /></button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}

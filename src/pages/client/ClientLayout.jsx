import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconHome, IconClipboard, IconDumbbell, IconLeaf, IconChart, IconTicket, IconLogout } from '../../components/ui/Icons'

const tabs = [
  { to: '/app', end: true, label: 'Tổng quan', Icon: IconHome },
  { to: '/app/program', label: 'Giáo án', Icon: IconDumbbell },
  { to: '/app/nutrition', label: 'Dinh dưỡng', Icon: IconLeaf },
  { to: '/app/progress', label: 'Tiến độ', Icon: IconChart },
  { to: '/app/sessions', label: 'Buổi tập', Icon: IconTicket },
  { to: '/app/assessment', label: 'Đánh giá', Icon: IconClipboard },
]

export default function ClientLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      {/* Persistent exit button (all tabs) */}
      <button
        onClick={async () => { await logout(); navigate('/', { replace: true }) }}
        title="Đăng xuất"
        style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 12px)', right: 14, zIndex: 60,
          width: 38, height: 38, borderRadius: 999, display: 'grid', placeItems: 'center',
          background: 'rgba(18,18,17,.7)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--pf-line)', color: 'var(--pf-muted)',
        }}
      >
        <IconLogout width={18} height={18} />
      </button>

      <Outlet />

      <nav className="bottomnav">
        <div className="bottomnav-inner">
          {tabs.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `navitem ${isActive ? 'active' : ''}`}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

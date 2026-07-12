import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconHome, IconDumbbell, IconLeaf, IconChart, IconTicket, IconLogout } from '../../components/ui/Icons'

// "Đánh giá" is a read-only reference page, not a frequent destination - it
// lives as a card link on Tổng quan instead of taking a fifth+sixth bottomnav
// slot (6 tabs don't fit a 375px phone without wrapping/crowding labels).
const tabs = [
  { to: '/app', end: true, label: 'Tổng quan', Icon: IconHome },
  { to: '/app/program', label: 'Giáo án', Icon: IconDumbbell },
  { to: '/app/nutrition', label: 'Dinh dưỡng', Icon: IconLeaf },
  { to: '/app/progress', label: 'Tiến độ', Icon: IconChart },
  { to: '/app/sessions', label: 'Buổi tập', Icon: IconTicket },
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
        aria-label="Đăng xuất"
        style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top) + 10px)', right: 12, zIndex: 60,
          width: 44, height: 44, borderRadius: 999, display: 'grid', placeItems: 'center',
          background: 'rgba(18,18,17,.88)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--pf-line)', color: 'var(--pf-text)',
          boxShadow: '0 4px 16px rgba(0,0,0,.45)',
          WebkitTapHighlightColor: 'transparent', cursor: 'pointer',
        }}
      >
        <IconLogout width={20} height={20} />
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

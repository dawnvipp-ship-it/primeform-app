import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { IconHome, IconDumbbell, IconLeaf, IconChart, IconTicket, IconMessage, IconLogout } from '../../components/ui/Icons'

// "Đánh giá" is a read-only reference page, not a frequent destination - it
// lives as a card link on Tổng quan instead of taking a bottomnav slot.
// Nhắn tin earns a slot despite the 6-tab width squeeze on a 375px phone
// (see global.css .navitem) because it's a frequent, two-way destination,
// unlike Đánh giá.
function tabsFor(base) {
  return [
    { to: base, end: true, label: 'Tổng quan', Icon: IconHome },
    { to: `${base}/program`, label: 'Giáo án', Icon: IconDumbbell },
    { to: `${base}/nutrition`, label: 'Dinh dưỡng', Icon: IconLeaf },
    { to: `${base}/progress`, label: 'Tiến độ', Icon: IconChart },
    { to: `${base}/sessions`, label: 'Buổi tập', Icon: IconTicket },
    { to: `${base}/messages`, label: 'Nhắn tin', Icon: IconMessage },
  ]
}

// basePath lets the coach-preview route (/coach/preview, see
// pages/coach/PreviewClient.jsx) reuse this exact layout+tabs instead of
// duplicating them — the real client app keeps the default untouched.
// previewMode: the "exit" button closes the tab (it was opened via
// window.open from ClientDetail specifically for this preview) instead of
// signing out + redirecting, since there's no client-facing "/" to land on.
export default function ClientLayout({ basePath = '/app', previewMode = false }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const tabs = tabsFor(basePath)

  async function handleExit() {
    await logout()
    if (previewMode) { window.close(); return }
    navigate('/', { replace: true })
  }

  return (
    <>
      {/* Persistent exit button (all tabs) */}
      <button
        onClick={handleExit}
        title={previewMode ? 'Đóng xem trước' : 'Đăng xuất'}
        aria-label={previewMode ? 'Đóng xem trước' : 'Đăng xuất'}
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

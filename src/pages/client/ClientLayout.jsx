import { Outlet, NavLink } from 'react-router-dom'
import { IconHome, IconClipboard, IconDumbbell, IconLeaf, IconChart, IconTicket } from '../../components/ui/Icons'

const tabs = [
  { to: '/app', end: true, label: 'Tổng quan', Icon: IconHome },
  { to: '/app/program', label: 'Giáo án', Icon: IconDumbbell },
  { to: '/app/nutrition', label: 'Dinh dưỡng', Icon: IconLeaf },
  { to: '/app/progress', label: 'Tiến độ', Icon: IconChart },
  { to: '/app/sessions', label: 'Buổi tập', Icon: IconTicket },
  { to: '/app/assessment', label: 'Đánh giá', Icon: IconClipboard },
]

export default function ClientLayout() {
  return (
    <>
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

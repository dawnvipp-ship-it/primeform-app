import { Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { PreviewAuthProvider, usePreviewAuth } from '../../context/PreviewAuthContext'
import { Loader } from '../../components/ui/primitives'

// Entry route for /coach/preview — coach clicks "Xem như học viên" on
// ClientDetail, which opens this in a NEW TAB with ?code=<client_code>.
// The code logs in the isolated preview Supabase client (never the coach's
// own session) and is then stripped from the URL bar so it doesn't sit in
// browser history. Reloading a /coach/preview/* URL without ?code still
// works as long as the preview session (localStorage key pf-preview-auth)
// hasn't expired — see PreviewAuthContext.
function Gate({ children }) {
  const { status, error } = usePreviewAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (status === 'loading') return <Loader label="Đang mở phiên xem…" />
  if (status !== 'authed') {
    return (
      <div className="center-screen" style={{ flexDirection: 'column', gap: 12, textAlign: 'center', padding: 24 }}>
        <div className="pf-display" style={{ fontSize: 20 }}>Không mở được phiên xem</div>
        <div className="faint" style={{ fontSize: 13 }}>{error || 'Quay lại trang khách hàng và bấm "Xem như học viên" lại.'}</div>
      </div>
    )
  }
  // Code no longer needed once the session is established — drop it from
  // the visible URL (replace, so back-button doesn't re-trigger login).
  if (new URLSearchParams(location.search).get('code')) {
    navigate(location.pathname, { replace: true })
  }
  return children
}

export default function PreviewClient() {
  const [params] = useSearchParams()
  const code = params.get('code')
  return (
    <PreviewAuthProvider code={code}>
      <Gate><Outlet /></Gate>
    </PreviewAuthProvider>
  )
}

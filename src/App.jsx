import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Loader } from './components/ui/primitives'

const Login        = lazy(() => import('./pages/Login'))
const ClientLayout = lazy(() => import('./pages/client/ClientLayout'))
const Dashboard    = lazy(() => import('./pages/client/Dashboard'))
const Assessment   = lazy(() => import('./pages/client/Assessment'))
const Program      = lazy(() => import('./pages/client/Program'))
const Nutrition    = lazy(() => import('./pages/client/Nutrition'))
const Progress     = lazy(() => import('./pages/client/Progress'))
const Sessions     = lazy(() => import('./pages/client/Sessions'))
const CoachLogin   = lazy(() => import('./pages/coach/CoachLogin'))
const CoachLayout  = lazy(() => import('./pages/coach/CoachLayout'))
const ClientList   = lazy(() => import('./pages/coach/ClientList'))
const ClientDetail = lazy(() => import('./pages/coach/ClientDetail'))
const Bookings     = lazy(() => import('./pages/coach/Bookings'))

export default function App() {
  const { status, role } = useAuth()

  if (status === 'loading') return <Loader label="Đang tải" />

  return (
    <Suspense fallback={<Loader label="Đang tải" />}>
      <Routes>
        {/* Entry */}
        <Route
          path="/"
          element={
            role === 'coach' ? <Navigate to="/coach" replace />
            : role === 'client' ? <Navigate to="/app" replace />
            : <Login />
          }
        />

        {/* Coach login */}
        <Route
          path="/coach/login"
          element={role === 'coach' ? <Navigate to="/coach" replace /> : <CoachLogin />}
        />

        {/* Client portal */}
        <Route
          path="/app"
          element={role === 'client' ? <ClientLayout /> : <Navigate to="/" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="assessment" element={<Assessment />} />
          <Route path="program" element={<Program />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="progress" element={<Progress />} />
          <Route path="sessions" element={<Sessions />} />
        </Route>

        {/* Coach dashboard */}
        <Route
          path="/coach"
          element={role === 'coach' ? <CoachLayout /> : <Navigate to="/coach/login" replace />}
        >
          <Route index element={<ClientList />} />
          <Route path="client/:id" element={<ClientDetail />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

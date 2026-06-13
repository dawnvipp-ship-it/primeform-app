import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Loader } from './components/ui/primitives'

import Login from './pages/Login'
import ClientLayout from './pages/client/ClientLayout'
import Dashboard from './pages/client/Dashboard'
import Assessment from './pages/client/Assessment'
import Program from './pages/client/Program'
import Nutrition from './pages/client/Nutrition'
import Progress from './pages/client/Progress'
import Sessions from './pages/client/Sessions'

import CoachLogin from './pages/coach/CoachLogin'
import CoachLayout from './pages/coach/CoachLayout'
import ClientList from './pages/coach/ClientList'
import ClientDetail from './pages/coach/ClientDetail'

export default function App() {
  const { status, role } = useAuth()

  if (status === 'loading') return <Loader label="Đang tải" />

  return (
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

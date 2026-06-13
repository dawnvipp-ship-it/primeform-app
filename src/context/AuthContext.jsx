import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, makeClientPortalClient } from '../lib/supabase'
import * as authApi from '../data/auth'

const AuthCtx = createContext(null)
const CLIENT_KEY = 'pf-client-session'

function decodeExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : 0
  } catch {
    return 0
  }
}

function loadStoredClient() {
  try {
    const raw = localStorage.getItem(CLIENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || decodeExp(parsed.token) < Date.now()) {
      localStorage.removeItem(CLIENT_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading') // loading | authed | anon
  const [role, setRole] = useState(null)           // client | coach
  const [client, setClient] = useState(null)       // { id, full_name }
  const [token, setToken] = useState(null)
  const [coachUser, setCoachUser] = useState(null)

  // Bootstrap: prefer an existing coach session, else a stored client session.
  useEffect(() => {
    let active = true
    ;(async () => {
      const session = await authApi.getCoachSession()
      if (!active) return
      if (session?.user) {
        setRole('coach'); setCoachUser(session.user); setStatus('authed'); return
      }
      const stored = loadStoredClient()
      if (stored) {
        setRole('client'); setClient(stored.client); setToken(stored.token); setStatus('authed'); return
      }
      setStatus('anon')
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess?.user) { setRole('coach'); setCoachUser(sess.user); setStatus('authed') }
    })
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [])

  const loginClient = useCallback(async (code) => {
    const res = await authApi.clientLogin(code)
    localStorage.setItem(CLIENT_KEY, JSON.stringify({ token: res.token, client: res.client }))
    setRole('client'); setClient(res.client); setToken(res.token); setStatus('authed')
  }, [])

  const loginCoach = useCallback(async (email, password) => {
    const res = await authApi.coachLogin(email, password)
    setRole('coach'); setCoachUser(res.user); setStatus('authed')
  }, [])

  const logout = useCallback(async () => {
    if (role === 'coach') await authApi.coachLogout()
    localStorage.removeItem(CLIENT_KEY)
    setRole(null); setClient(null); setToken(null); setCoachUser(null); setStatus('anon')
  }, [role])

  // The db client every query should use, chosen by role.
  const db = useMemo(() => {
    if (role === 'client' && token) return makeClientPortalClient(token)
    return supabase // coach (authed) or anon
  }, [role, token])

  const value = useMemo(() => ({
    status, role, client, coachUser, db, loginClient, loginCoach, logout,
  }), [status, role, client, coachUser, db, loginClient, loginCoach, logout])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as authApi from '../data/auth'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading') // loading | authed | anon
  const [role, setRole] = useState(null)           // client | coach
  const [client, setClient] = useState(null)
  const [coachUser, setCoachUser] = useState(null)
  const resolving = useRef(false)

  const applyResolved = useCallback((r) => {
    if (r.role === 'coach') { setRole('coach'); setCoachUser(r.user); setClient(null); setStatus('authed') }
    else if (r.role === 'client') { setRole('client'); setClient(r.client); setCoachUser(null); setStatus('authed') }
    else { setRole(null); setClient(null); setCoachUser(null); setStatus('anon') }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      const session = await authApi.getSession()
      if (!active) return
      if (!session?.user) { setStatus('anon'); return }
      const r = await authApi.resolveRole()
      if (active) applyResolved(r)
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      if (resolving.current) return
      if (!sess?.user) { setRole(null); setClient(null); setCoachUser(null); setStatus('anon'); return }
      const r = await authApi.resolveRole()
      applyResolved(r)
    })
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [applyResolved])

  const loginClient = useCallback(async (code) => {
    resolving.current = true
    try {
      const c = await authApi.clientLogin(code)
      setRole('client'); setClient(c); setCoachUser(null); setStatus('authed')
    } finally { resolving.current = false }
  }, [])

  const loginCoach = useCallback(async (email, password) => {
    resolving.current = true
    try {
      const res = await authApi.coachLogin(email, password)
      setRole('coach'); setCoachUser(res.user); setClient(null); setStatus('authed')
    } finally { resolving.current = false }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setRole(null); setClient(null); setCoachUser(null); setStatus('anon')
  }, [])

  const value = useMemo(() => ({
    status, role, client, coachUser, db: supabase, loginClient, loginCoach, logout,
  }), [status, role, client, coachUser, loginClient, loginCoach, logout])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

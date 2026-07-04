import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as authApi from '../data/auth'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  // If no Supabase session is stored locally, skip the loading screen entirely
  const [status, setStatus] = useState(() => {
    try {
      const hasSession = Object.keys(localStorage).some(
        k => k.startsWith('sb-') && k.includes('auth')
      )
      return hasSession ? 'loading' : 'anon'
    } catch {
      return 'loading'
    }
  })
  const [role, setRole] = useState(null)           // client | coach
  const [client, setClient] = useState(null)
  const [coachUser, setCoachUser] = useState(null)
  const [isHeadCoach, setIsHeadCoach] = useState(false)
  const [coachFullName, setCoachFullName] = useState(null)
  const resolving = useRef(false)

  const applyResolved = useCallback((r) => {
    if (r.role === 'coach') {
      setRole('coach'); setCoachUser(r.user); setClient(null)
      setIsHeadCoach(!!r.isHeadCoach); setCoachFullName(r.coachFullName ?? null)
      setStatus('authed')
    }
    else if (r.role === 'client') {
      setRole('client'); setClient(r.client); setCoachUser(null)
      setIsHeadCoach(false); setCoachFullName(null)
      setStatus('authed')
    }
    else { setRole(null); setClient(null); setCoachUser(null); setIsHeadCoach(false); setCoachFullName(null); setStatus('anon') }
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
      if (!sess?.user) {
        setRole(null); setClient(null); setCoachUser(null)
        setIsHeadCoach(false); setCoachFullName(null); setStatus('anon')
        return
      }
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
      await authApi.coachLogin(email, password)
      // Re-resolve (rather than trusting the raw login response) so
      // isHeadCoach/coachFullName are populated immediately, not just after
      // the next onAuthStateChange tick.
      const r = await authApi.resolveRole()
      applyResolved(r)
    } finally { resolving.current = false }
  }, [applyResolved])

  const logout = useCallback(async () => {
    await authApi.logout()
    setRole(null); setClient(null); setCoachUser(null)
    setIsHeadCoach(false); setCoachFullName(null); setStatus('anon')
  }, [])

  const value = useMemo(() => ({
    status, role, client, coachUser, isHeadCoach, coachFullName, db: supabase, loginClient, loginCoach, logout,
  }), [status, role, client, coachUser, isHeadCoach, coachFullName, loginClient, loginCoach, logout])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

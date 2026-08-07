import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import * as authApi from '../data/auth'

const AuthCtx = createContext(null)

// Neither getSession() nor resolveRole() had a catch anywhere they were
// called from this file - a rejected (or simply hung) request left `status`
// stuck at 'loading' forever, since nothing ever set a terminal value. App.jsx
// renders a full-screen loader for that whole time, so the only way out was
// force-quitting and reopening the app (a fresh mount gives the network
// another chance). Race every resolveRole()/getSession() call against this
// so a slow/dead connection times out into 'anon' (the login screen) instead
// of hanging indefinitely - worse case is re-entering the access code, not a
// frozen app.
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export function AuthProvider({ children }) {
  // If no Supabase session is stored locally, skip the loading screen entirely.
  // storageKey is 'pf-auth' (set in supabase.js), so check that exact key —
  // not the default 'sb-*' pattern which never matches a custom storageKey.
  const [status, setStatus] = useState(() => {
    try {
      const hasSession = !!localStorage.getItem('pf-auth')
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
      try {
        const session = await withTimeout(authApi.getSession())
        if (!active) return
        if (!session?.user) { setStatus('anon'); return }
        const r = await withTimeout(authApi.resolveRole())
        if (active) applyResolved(r)
      } catch {
        if (active) setStatus('anon')
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      if (resolving.current) return
      if (!sess?.user) {
        setRole(null); setClient(null); setCoachUser(null)
        setIsHeadCoach(false); setCoachFullName(null); setStatus('anon')
        return
      }
      try {
        const r = await withTimeout(authApi.resolveRole())
        applyResolved(r)
      } catch {
        // resolveRole() timed out or hit a network error, but the session is
        // still valid (sess.user is present). Don't log the user out — a slow
        // mobile connection or a TOKEN_REFRESHED event mid-handoff shouldn't
        // kick someone to the login screen. Keep the current status so they
        // stay in the app; the next event or page reload will re-resolve.
      }
    })
    return () => { active = false; sub?.subscription?.unsubscribe?.() }
  }, [applyResolved])

  const loginClient = useCallback(async (code) => {
    resolving.current = true
    try {
      // 15-second timeout covers Edge Function cold-start (~3-4s) + slow mobile
      // network. Without this, the button stays at "Đang mở…" forever on a
      // hung request and the only escape is force-quitting the app.
      const c = await withTimeout(authApi.clientLogin(code), 15000)
      setRole('client'); setClient(c); setCoachUser(null); setStatus('authed')
    } catch (e) {
      if (e.message === 'timeout') throw new Error('Kết nối chậm, thử lại.')
      throw e
    } finally { resolving.current = false }
  }, [])

  const loginCoach = useCallback(async (email, password) => {
    resolving.current = true
    try {
      await authApi.coachLogin(email, password)
      // Re-resolve (rather than trusting the raw login response) so
      // isHeadCoach/coachFullName are populated immediately, not just after
      // the next onAuthStateChange tick.
      const r = await withTimeout(authApi.resolveRole())
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

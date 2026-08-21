import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabasePreview } from '../lib/supabasePreview'
import { AuthCtx } from './AuthContext'

// Coach-only "Xem như học viên" preview. Logs the isolated preview Supabase
// client (separate storageKey, see lib/supabasePreview.js) into a client
// session using the access code — same mechanism as the real client login
// (data/auth.js clientLogin) but duplicated here on purpose, targeting the
// preview client instead of the shared singleton, so this never touches the
// coach's own session in the same tab/origin.
async function previewLogin(code) {
  const { data, error } = await supabasePreview.functions.invoke('client-login', {
    body: { code: String(code || '').trim().toUpperCase() },
  })
  if (error) {
    let msg = 'Mã không hợp lệ'
    try { const ctx = await error.context?.json?.(); if (ctx?.error) msg = ctx.error } catch (_) {}
    throw new Error(msg)
  }
  if (!data?.session?.access_token) throw new Error(data?.error || 'Mã không hợp lệ hoặc đã bị khoá')
  const { error: sErr } = await supabasePreview.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (sErr) throw new Error(sErr.message)
  return data.client
}

const PreviewCtx = createContext(null)

// code: access code to log in with on first mount (may be null if a session
// is already persisted under pf-preview-auth from a previous preview tab).
export function PreviewAuthProvider({ code, children }) {
  const [state, setState] = useState({ status: 'loading', client: null, error: null })

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (code) {
          const c = await previewLogin(code)
          if (active) setState({ status: 'authed', client: c, error: null })
          return
        }
        const { data } = await supabasePreview.auth.getSession()
        if (!data?.session) { if (active) setState({ status: 'error', client: null, error: 'Chưa có phiên xem trước.' }); return }
        const { data: rows, error } = await supabasePreview.from('clients').select('id, full_name').limit(1)
        if (error || !rows?.[0]) { if (active) setState({ status: 'error', client: null, error: 'Phiên xem trước đã hết hạn.' }); return }
        if (active) setState({ status: 'authed', client: rows[0], error: null })
      } catch (e) {
        if (active) setState({ status: 'error', client: null, error: e.message || 'Không mở được phiên xem.' })
      }
    })()
    return () => { active = false }
  }, [code])

  const logout = useCallback(async () => { await supabasePreview.auth.signOut() }, [])

  const authValue = {
    status: state.status === 'authed' ? 'authed' : (state.status === 'loading' ? 'loading' : 'anon'),
    role: state.status === 'authed' ? 'client' : null,
    client: state.client,
    coachUser: null, isHeadCoach: false, coachFullName: null,
    db: supabasePreview,
    logout,
  }

  return (
    <PreviewCtx.Provider value={state}>
      <AuthCtx.Provider value={authValue}>{children}</AuthCtx.Provider>
    </PreviewCtx.Provider>
  )
}

export function usePreviewAuth() {
  const ctx = useContext(PreviewCtx)
  if (!ctx) throw new Error('usePreviewAuth must be used within PreviewAuthProvider')
  return ctx
}

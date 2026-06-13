import { supabase } from '../lib/supabase'

/**
 * Client login by access code.
 * Calls the `client-login` edge function, which verifies the code server-side
 * (the frontend never queries client_code directly) and returns a scoped JWT.
 */
export async function clientLogin(code) {
  const { data, error } = await supabase.functions.invoke('client-login', {
    body: { code: String(code || '').trim().toUpperCase() },
  })
  if (error) {
    // Edge function returns 401 with a message for bad codes
    let msg = 'Mã không hợp lệ'
    try {
      const ctx = await error.context?.json?.()
      if (ctx?.error) msg = ctx.error
    } catch (_) { /* ignore */ }
    throw new Error(msg)
  }
  if (!data?.token) throw new Error('Mã không hợp lệ hoặc đã bị khoá')
  return data // { token, client: { id, full_name } }
}

export async function coachLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function coachLogout() {
  await supabase.auth.signOut()
}

export async function getCoachSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

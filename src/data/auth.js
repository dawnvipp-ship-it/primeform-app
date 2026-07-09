import { supabase } from '../lib/supabase'

// Client login by access code → native Supabase session (V1.3).
export async function clientLogin(code) {
  const { data, error } = await supabase.functions.invoke('client-login', {
    body: { code: String(code || '').trim().toUpperCase() },
  })
  if (error) {
    let msg = 'Mã không hợp lệ'
    try { const ctx = await error.context?.json?.(); if (ctx?.error) msg = ctx.error } catch (_) {}
    throw new Error(msg)
  }
  if (!data?.session?.access_token) throw new Error(data?.error || 'Mã không hợp lệ hoặc đã bị khoá')
  // Establish the session on the shared client.
  const { error: sErr } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (sErr) throw new Error(sErr.message)
  return data.client // { id, full_name }
}

export async function coachLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

// Decide whether the logged-in user is a coach or a client.
export async function resolveRole() {
  const { data: u } = await supabase.auth.getUser()
  const user = u?.user
  if (!user) return { role: null }
  // Coach and client lookups are independent — run in parallel instead of
  // sequentially so the common (client) case doesn't pay for a wasted
  // round-trip on the coach check first.
  const [{ data: coach }, { data: cli }] = await Promise.all([
    supabase.from('coaches').select('id, full_name, is_head_coach').eq('id', user.id).maybeSingle(),
    supabase.from('clients').select('id, full_name').eq('auth_user_id', user.id).maybeSingle(),
  ])
  if (coach) return { role: 'coach', user, isHeadCoach: !!coach.is_head_coach, coachFullName: coach.full_name }
  if (cli) return { role: 'client', client: cli, user }
  return { role: null, user }
}

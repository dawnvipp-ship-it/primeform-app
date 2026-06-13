import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!URL || !ANON) {
  // Fail loud in dev so misconfiguration is obvious.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

/**
 * Base client.
 * Used for: coach auth (email/password) and invoking the client-login edge function.
 * Coach queries also run through this client once a coach session exists.
 */
export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pf-coach-auth' },
})

/**
 * Client-portal client, bound to a custom JWT minted by the `client-login`
 * edge function. Every request carries the client_id claim, so RLS scopes
 * all reads to that single client. Read-only by policy.
 */
export function makeClientPortalClient(token) {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const SUPABASE_URL = URL

import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!URL || !ANON) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Single client for both coach and client.
// Coach: signInWithPassword. Client: session minted by the client-login
// edge function and applied via supabase.auth.setSession. RLS scopes all data.
export const supabase = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pf-auth' },
})

export const SUPABASE_URL = URL

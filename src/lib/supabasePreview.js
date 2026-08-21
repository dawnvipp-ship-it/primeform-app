import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// Separate client + storage key from the main `supabase` singleton (lib/supabase.js).
// Used only by the coach "Xem như học viên" preview (pages/coach/PreviewClient.jsx)
// so a coach can open a client's session in a new tab without touching their own
// coach session, which lives under the 'pf-auth' key on the same origin.
export const supabasePreview = createClient(URL, ANON, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pf-preview-auth' },
})

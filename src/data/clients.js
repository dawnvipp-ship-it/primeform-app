// All functions take `db` (a supabase client) so coach (authed) and client
// (token-bound) share the same query layer. RLS decides what each can see/do.

const COLS = 'id, client_code, full_name, phone, email, start_date, active, total_sessions, used_sessions, remaining_sessions, created_at'

export async function listClients(db) {
  const { data, error } = await db
    .from('clients')
    .select(COLS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getClient(db, id) {
  const { data, error } = await db.from('clients').select(COLS).eq('id', id).single()
  if (error) throw error
  return data
}

// Client portal: RLS limits the row to the logged-in client, so just take the first.
export async function getMyClient(db) {
  const { data, error } = await db.from('clients').select(COLS).limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

export async function createClient(db, payload) {
  const { data, error } = await db.from('clients').insert(payload).select(COLS).single()
  if (error) throw error
  return data
}

export async function updateClient(db, id, patch) {
  const { data, error } = await db.from('clients').update(patch).eq('id', id).select(COLS).single()
  if (error) throw error
  return data
}

export async function updateSessions(db, id, { total_sessions, used_sessions }) {
  return updateClient(db, id, { total_sessions, used_sessions })
}

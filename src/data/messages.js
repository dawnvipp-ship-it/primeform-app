export async function listMessages(db, clientId) {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage(db, clientId, sender, body) {
  const { data, error } = await db
    .from('messages')
    .insert({ client_id: clientId, sender, body: body.trim() })
    .select('*').single()
  if (error) throw error
  return data
}

// Live incoming messages for this client's thread - returns an unsubscribe fn.
export function subscribeMessages(db, clientId, onInsert) {
  const channel = db
    .channel(`messages:${clientId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe()
  return () => db.removeChannel(channel)
}

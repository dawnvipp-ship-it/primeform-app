export async function listCheckins(db, clientId) {
  const { data, error } = await db
    .from('checkins').select('*').eq('client_id', clientId)
    .order('checkin_date', { ascending: false })
  if (error) throw error
  return data
}

export async function addCheckin(db, clientId, fields) {
  const { data, error } = await db
    .from('checkins').insert({ client_id: clientId, ...fields }).select('*').single()
  if (error) throw error
  return data
}

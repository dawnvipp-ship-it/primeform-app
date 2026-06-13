export async function getAssessment(db, clientId) {
  const { data, error } = await db
    .from('assessments').select('*').eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return data
}

// One assessment per client (unique constraint) → upsert on client_id.
export async function upsertAssessment(db, clientId, fields) {
  const { data, error } = await db
    .from('assessments')
    .upsert({ client_id: clientId, ...fields }, { onConflict: 'client_id' })
    .select('*').single()
  if (error) throw error
  return data
}

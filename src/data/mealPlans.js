export async function getMealPlan(db, clientId) {
  const { data, error } = await db
    .from('meal_plans').select('*').eq('client_id', clientId).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertMealPlan(db, clientId, fields) {
  const { data, error } = await db
    .from('meal_plans')
    .upsert({ client_id: clientId, ...fields }, { onConflict: 'client_id' })
    .select('*').single()
  if (error) throw error
  return data
}

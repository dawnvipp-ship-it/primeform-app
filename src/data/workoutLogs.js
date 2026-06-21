export async function getTodayLog(db, exerciseId) {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await db
    .from('workout_logs')
    .select('*')
    .eq('exercise_id', exerciseId)
    .eq('logged_at', today)
    .maybeSingle()
  return data
}

export async function upsertTopSet(db, clientId, exerciseId, topSetWeight) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await db
    .from('workout_logs')
    .upsert(
      { client_id: clientId, exercise_id: exerciseId, logged_at: today, top_set_weight: topSetWeight },
      { onConflict: 'exercise_id,logged_at' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

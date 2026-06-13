// A "program" row = one workout day (within a phase/week).
// program_exercises hang off it, ordered by order_index.

export async function listPrograms(db, clientId) {
  const { data, error } = await db
    .from('programs')
    .select('*, program_exercises(*)')
    .eq('client_id', clientId)
    .order('order_index', { ascending: true })
  if (error) throw error
  // sort nested exercises by order_index
  return (data || []).map((p) => ({
    ...p,
    program_exercises: (p.program_exercises || []).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    ),
  }))
}

export async function createProgramDay(db, clientId, { phase, week, workout_day, order_index }) {
  const { data, error } = await db
    .from('programs')
    .insert({ client_id: clientId, phase, week, workout_day, order_index: order_index ?? 0 })
    .select('*').single()
  if (error) throw error
  return data
}

export async function updateProgramDay(db, id, patch) {
  const { data, error } = await db.from('programs').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteProgramDay(db, id) {
  const { error } = await db.from('programs').delete().eq('id', id)
  if (error) throw error
}

export async function addExercise(db, programId, fields) {
  const { data, error } = await db
    .from('program_exercises')
    .insert({ program_id: programId, ...fields })
    .select('*').single()
  if (error) throw error
  return data
}

export async function updateExercise(db, id, patch) {
  const { data, error } = await db
    .from('program_exercises').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function deleteExercise(db, id) {
  const { error } = await db.from('program_exercises').delete().eq('id', id)
  if (error) throw error
}

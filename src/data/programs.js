import { localISODate } from '../lib/date'

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

// Delete every day belonging to a phase (used when deleting the whole phase).
export async function deletePhaseDays(db, clientId, phase) {
  const { error } = await db.from('programs').delete().eq('client_id', clientId).eq('phase', phase)
  if (error) throw error
}

// Re-point every day currently tagged with `fromPhase` to `toPhase` - used
// when renaming a phase, since `programs.phase` is a plain text tag, not a
// foreign key into program_phases.
export async function renamePhaseOnDays(db, clientId, fromPhase, toPhase) {
  const { error } = await db.from('programs').update({ phase: toPhase }).eq('client_id', clientId).eq('phase', fromPhase)
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

// Replace ALL exercises for a program day (used by the paste editor).
export async function setDayExercises(db, programId, exercises) {
  const del = await db.from('program_exercises').delete().eq('program_id', programId)
  if (del.error) throw del.error
  if (!exercises.length) return []
  const rows = exercises.map((ex, i) => ({ program_id: programId, order_index: i, ...ex }))
  const { data, error } = await db.from('program_exercises').insert(rows).select('*')
  if (error) throw error
  return data
}

// ---------- Phases (program_phases: real rows, not the old localStorage hack) ----------

export async function listPhases(db, clientId) {
  const { data, error } = await db
    .from('program_phases')
    .select('*')
    .eq('client_id', clientId)
    .order('order_index', { ascending: true })
  if (error) throw error
  return data || []
}

// `name` doubles as the natural key (onConflict client_id,name) - renaming a
// phase is delete-old + upsert-new, handled by the caller alongside
// renamePhaseOnDays, not by this function alone.
export async function upsertPhase(db, clientId, name, fields) {
  const { data, error } = await db
    .from('program_phases')
    .upsert({ client_id: clientId, name, ...fields }, { onConflict: 'client_id,name' })
    .select('*').single()
  if (error) throw error
  return data
}

export async function deletePhaseRow(db, clientId, name) {
  const { error } = await db.from('program_phases').delete().eq('client_id', clientId).eq('name', name)
  if (error) throw error
}

export async function reorderPhases(db, clientId, orderedNames) {
  await Promise.all(orderedNames.map((name, i) => upsertPhase(db, clientId, name, { order_index: i })))
}

// ---------- Workout completions (drives "buổi kế tiếp" + used_sessions) ----------

// Server-side RPC (SECURITY DEFINER): a client can't update clients.used_sessions
// directly (RLS only allows coaches to write that table), so marking a workout
// done goes through this one narrow function instead - it resolves the caller's
// own client row via auth.uid(), verifies the program day belongs to them, logs
// the completion, and increments used_sessions (capped at total_sessions).
export async function markWorkoutComplete(db, programId, durationSeconds) {
  const { error } = await db.rpc('complete_workout', {
    p_program_id: programId,
    p_duration_seconds: durationSeconds ?? null,
  })
  if (error) throw error
}

// Ordered so the most recently *marked* completion is first, not just the
// most recent date - completed_date is date-only, so same-day completions
// (e.g. a client/coach testing multiple days in one sitting) tie on that
// column alone; created_at breaks the tie with real chronological order,
// which "buổi kế tiếp" rotation on the Dashboard depends on.
export async function listCompletions(db, clientId) {
  const { data, error } = await db
    .from('workout_completions')
    .select('*')
    .eq('client_id', clientId)
    .order('completed_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export function isCompletedToday(completions, programId) {
  const today = localISODate()
  return (completions || []).some((c) => c.program_id === programId && c.completed_date === today)
}

// ---------- Per-week top-set weight (workout_logs.week_number) ----------
// `logged_at` is legacy (NOT NULL, always set to today on write) - the actual
// per-week value lives in week_number/top_set_weight, filtered independently.

export async function getWeekLogs(db, clientId, exerciseId) {
  const { data, error } = await db
    .from('workout_logs')
    .select('week_number, top_set_weight')
    .eq('client_id', clientId)
    .eq('exercise_id', exerciseId)
    .not('week_number', 'is', null)
  if (error) throw error
  return data || []
}

export async function upsertWeekLog(db, clientId, exerciseId, weekNumber, topSetWeight) {
  const { data, error } = await db
    .from('workout_logs')
    .upsert(
      {
        client_id: clientId,
        exercise_id: exerciseId,
        week_number: weekNumber,
        top_set_weight: topSetWeight,
        logged_at: localISODate(),
      },
      { onConflict: 'client_id,exercise_id,week_number' }
    )
    .select('*').single()
  if (error) throw error
  return data
}

// ---------- Muscle-group heat (body map) ----------
// Each program day carries a coach-picked muscle_groups tag (set once per
// day, not per exercise - keeps tagging effort low). "Heat" per group is a
// count of completions in the window, normalized to the busiest group so
// the body map always has one fully-lit region as a visual anchor.
export function computeMuscleHeat(programs, completions, { days = 30 } = {}) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = localISODate(cutoff)

  const programById = {}
  programs.forEach((p) => { programById[p.id] = p })

  const counts = {}
  let maxCount = 0
  completions.forEach((c) => {
    if (c.completed_date < cutoffStr) return
    const groups = programById[c.program_id]?.muscle_groups || []
    groups.forEach((g) => {
      counts[g] = (counts[g] ?? 0) + 1
      if (counts[g] > maxCount) maxCount = counts[g]
    })
  })

  const heat = {}
  Object.entries(counts).forEach(([g, count]) => { heat[g] = maxCount > 0 ? count / maxCount : 0 })
  return heat
}

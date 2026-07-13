import { localISODate } from '../lib/date'

// Fixed habit set - not coach-configurable (v1 keeps this simple; a
// per-client custom list can come later if it turns out to matter).
export const HABITS = [
  { key: 'water', label: 'Uống đủ nước' },
  { key: 'sleep', label: 'Ngủ đủ giấc' },
  { key: 'move', label: 'Vận động' },
  { key: 'diet', label: 'Ăn đúng kế hoạch' },
]

const today = () => localISODate()

// Recent window wide enough for a meaningful streak count without pulling
// the client's entire history every time the dashboard loads.
export async function getRecentHabitLogs(db, clientId, days = 35) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await db
    .from('habit_logs')
    .select('habit_key, log_date, done')
    .eq('client_id', clientId)
    .gte('log_date', localISODate(since))
  if (error) throw error
  return data || []
}

export async function toggleHabit(db, clientId, habitKey, done) {
  const { error } = await db
    .from('habit_logs')
    .upsert(
      { client_id: clientId, habit_key: habitKey, log_date: today(), done },
      { onConflict: 'client_id,habit_key,log_date' }
    )
  if (error) throw error
}

// Consecutive days ending today. If today isn't logged yet, count from
// yesterday instead - the streak shouldn't visually reset to 0 the moment
// the day starts, only once a full day passes without completion.
export function computeStreak(logs, habitKey) {
  const doneDates = new Set(
    logs.filter((l) => l.habit_key === habitKey && l.done).map((l) => l.log_date)
  )
  const d = new Date()
  if (!doneDates.has(today())) d.setDate(d.getDate() - 1)
  let streak = 0
  while (doneDates.has(localISODate(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

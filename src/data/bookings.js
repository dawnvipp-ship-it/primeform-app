// Booking / scheduling: a client books a slot with their own assigned coach,
// 07:00-21:00 (hourly), the coach must confirm before it's real. RLS enforces
// all of the scoping/ownership rules server-side - see the client_insert_own /
// coach_select_scoped / coach_update_scoped policies on the `bookings` table,
// so these functions stay thin wrappers, same shape as clients.js/programs.js.

// 07:00..20:00 in 30-minute steps ("HH:MM" strings, not hour ints) - last
// slot is 20:00 (not 20:30) so a 1-hour session still finishes by 21:00.
export const SLOT_TIMES = Array.from({ length: 27 }, (_, i) => {
  const h = 7 + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export async function listMyBookings(db) {
  const { data, error } = await db
    .from('bookings')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })
  if (error) throw error
  return data || []
}

// Existing (non-cancelled) bookings for one coach on one date, so the client
// UI can grey out slots that are already taken by ANOTHER client. A client's
// own session can only SELECT their own rows (RLS policy client_select_own),
// so a direct `.from('bookings')` query here would silently return nothing
// for other clients' bookings - looked like "no slots taken" instead of
// erroring, so it went unnoticed until someone tried to double-book a slot.
// get_booked_slots() is a SECURITY DEFINER RPC (already existed + already
// granted to `authenticated`, just never wired up here) that returns only
// coach_id/date/time for one day - no client identity, safe for any client
// to call regardless of whose bookings they are.
// fromDate/toDate: kept for the caller's signature, but the RPC is one day
// at a time - the only caller (Sessions.jsx) always passes the same date for
// both, so this just uses fromDate.
export async function listSlotsForRange(db, coach, fromDate, _toDate) {
  const { data, error } = await db.rpc('get_booked_slots', { p_coach_id: coach, p_date: fromDate })
  if (error) throw error
  return (data || []).map((r) => ({ time: r.slot_time }))
}

export async function createBooking(db, { clientId, coach, date, time, notes }) {
  const { data, error } = await db
    .from('bookings')
    .insert({
      client_id: clientId,
      coach_id: coach,
      date,
      time,
      notes: notes ?? null,
      status: 'pending',
    })
    .select('*').single()
  if (error) throw error
  return data
}

// Coach enters a booking directly - clients at this studio arrange times with
// their coach (in person / Zalo) rather than requesting through the app, so
// there's no pending step: it's real as soon as the coach saves it. RLS
// (coach_insert_scoped) only allows this for the coach's own clients, on that
// client's assigned coach's calendar; the head coach can do it for anyone.
// A slot already taken by that coach fails with Postgres code 23505 (the
// bookings_coach_slot_unique index) - callers use that to skip, not abort.
export async function createCoachBooking(db, { clientId, coach, date, time }) {
  const { data, error } = await db
    .from('bookings')
    .insert({ client_id: clientId, coach_id: coach, date, time, status: 'confirmed' })
    .select('*').single()
  if (error) throw error
  return data
}

// Sessions run 60 minutes but a booking only stores its start time, and the
// unique index only blocks an identical start - so 09:00 and 09:30 for the
// same coach can both exist. This finds what a new start time would collide
// with: `exact` (same start, cannot be saved) and `near` (starts within the
// hour either side - allowed, but worth a warning).
export const SESSION_MINUTES = 60
const toMinutes = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0) }
export function findSlotClashes(bookings, coach, date, time) {
  const at = toMinutes(time)
  const sameDay = (bookings || []).filter((b) => b.coach_id === coach && b.date === date && b.status !== 'cancelled')
  return {
    exact: sameDay.find((b) => b.time === time) || null,
    near: sameDay.filter((b) => b.time !== time && Math.abs(toMinutes(b.time) - at) < SESSION_MINUTES),
  }
}

export async function cancelMyBooking(db, id) {
  const { data, error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('*').single()
  if (error) throw error
  return data
}

// Coach-side list for a date range. RLS already scopes this to the caller's
// own coach_id (or every row, if the caller is the head coach) - no explicit
// coach filter needed here. Embeds the client's name (coaches can already see
// every client via ClientList, so no extra RLS concern) for display in the
// weekly grid.
export async function listCoachBookings(db, { from, to, status } = {}) {
  let q = db
    .from('bookings')
    .select('*, clients(full_name)')
    .order('date', { ascending: true })
    .order('time', { ascending: true })
  if (from) q = q.gte('date', from)
  if (to) q = q.lte('date', to)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map((b) => ({ ...b, client_name: b.clients?.full_name ?? null }))
}

export async function confirmBooking(db, id) {
  const { data, error } = await db
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .select('*').single()
  if (error) throw error
  return data
}

// No distinct "rejected" status exists on the table (only pending/confirmed/
// cancelled/completed/no_show) - rejecting a pending request is the same
// state transition as a cancellation.
export async function rejectBooking(db, id) {
  const { data, error } = await db
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select('*').single()
  if (error) throw error
  return data
}

// Client-side grouping for the head-coach aggregate card - bookings is
// already the full cross-coach list by then (RLS returns everything to a
// head coach), so this just tallies non-cancelled rows per coach_id.
export function groupWeeklyTotalsByCoach(bookings) {
  const totals = {}
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    totals[b.coach_id] = (totals[b.coach_id] ?? 0) + 1
  }
  return totals
}

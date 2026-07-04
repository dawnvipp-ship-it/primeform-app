// Booking / scheduling: a client books a slot with their own assigned coach,
// 07:00-21:00 (hourly), the coach must confirm before it's real. RLS enforces
// all of the scoping/ownership rules server-side - see the client_insert_own /
// coach_select_scoped / coach_update_scoped policies on the `bookings` table,
// so these functions stay thin wrappers, same shape as clients.js/programs.js.

export const SLOT_HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07:00..20:00

export async function listMyBookings(db) {
  const { data, error } = await db
    .from('bookings')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })
  if (error) throw error
  return data || []
}

// Existing (non-cancelled) bookings for one coach in a date range, so the
// client UI can grey out slots that are already taken.
export async function listSlotsForRange(db, coach, fromDate, toDate) {
  const { data, error } = await db
    .from('bookings')
    .select('date, time')
    .eq('coach_id', coach)
    .in('status', ['pending', 'confirmed'])
    .gte('date', fromDate)
    .lte('date', toDate)
  if (error) throw error
  return data || []
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

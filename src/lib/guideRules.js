// "Gợi ý đúng lúc": which Cẩm nang card to surface on the dashboard, decided only
// from data the app already has. Pure - everything comes in as arguments.
//
// Rules are checked in priority order and the FIRST one that fires (and whose card
// is approved and not recently opened) wins; at most one suggestion is ever shown.
// Missing data never fires a rule: no data is not evidence the client slipped.
import { localISODate } from './date'
import { JOURNEY_METRICS, journeyFor, targetsFrom, daysUntil } from './journey'

export const TAP_COOLDOWN_DAYS = 14

// ruleId -> card id. A card with no rule is library-only.
export const RULE_CARD = {
  R01: 'PF03', // weight went up
  R05: 'PF07', // sleep below target
  R07: 'PF10', // was active, now quiet
  R10: 'PF04', // waist improved, weight did not
  R04: 'PF06', // weight flat while still above target
  R02: 'PF02', // weeks 3-5
  R03: 'PF01', // first two weeks
}
// Order matters: most situational first, time-based last.
export const RULE_ORDER = ['R01', 'R05', 'R07', 'R10', 'R04', 'R02', 'R03']

const WEIGHT = JOURNEY_METRICS.find((m) => m.key === 'weight')
const WAIST = JOURNEY_METRICS.find((m) => m.key === 'waist')

function isoMinusDays(now, n) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return localISODate(d)
}
const posNum = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null }

function weightSeries(logs) {
  return (logs || [])
    .map((l) => ({ date: l.log_date, value: posNum(l.weight) }))
    .filter((p) => p.date && p.value !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// R01 - the latest weigh-in is at least 0.5 kg above the one before it, both within 14 days.
function r01(ctx) {
  const s = weightSeries(ctx.logs)
  if (s.length < 2) return false
  const [prev, last] = [s[s.length - 2], s[s.length - 1]]
  const since = isoMinusDays(ctx.now, 14)
  return prev.date >= since && last.date >= since && last.value - prev.value >= 0.5 - 1e-9
}

// R05 - sleep logged with an amount at least 1 h under the target on 2+ of the last 3 days.
function r05(ctx) {
  const target = targetsFrom(ctx.assessment).sleepHours
  const days = new Set([0, 1, 2].map((i) => isoMinusDays(ctx.now, i)))
  const low = new Set(
    (ctx.habitLogs || [])
      .filter((l) => l.habit_key === 'sleep' && days.has(l.log_date) && l.value !== null && l.value !== undefined && Number.isFinite(Number(l.value)))
      .filter((l) => Number(l.value) <= target - 1)
      .map((l) => l.log_date)
  )
  return low.size >= 2
}

// R07 - ticked "vận động" on 3+ days in the fortnight before, but not at all in the last 3 days.
// (A client who never ticks it is not "quiet", just not using it.)
function r07(ctx) {
  const ticked = new Set((ctx.habitLogs || []).filter((l) => l.habit_key === 'move' && l.done).map((l) => l.log_date))
  const recent = [0, 1, 2].map((i) => isoMinusDays(ctx.now, i))
  if (recent.some((d) => ticked.has(d))) return false
  let before = 0
  for (let i = 3; i <= 16; i++) if (ticked.has(isoMinusDays(ctx.now, i))) before++
  return before >= 3
}

// R10 - waist is down 1 cm+ since the start while weight has not meaningfully dropped.
function r10(ctx) {
  const waist = journeyFor(WAIST, ctx.assessment, ctx.logs)
  const weight = journeyFor(WEIGHT, ctx.assessment, ctx.logs)
  if (!waist.baseline || waist.single || waist.delta === null) return false
  if (!weight.baseline || weight.single || weight.delta === null) return false
  return waist.delta <= -1 && weight.delta >= -0.5
}

// R04 - heading for a lower weight, but the last 4 weeks of weigh-ins span 2+ weeks and moved 0.3 kg or less.
function r04(ctx) {
  const j = journeyFor(WEIGHT, ctx.assessment, ctx.logs)
  if (!j.baseline || j.single || j.target === null || !(j.baseline.value > j.target) || !(j.current.value > j.target)) return false
  const since = isoMinusDays(ctx.now, 28)
  const s = weightSeries(ctx.logs).filter((p) => p.date >= since)
  if (s.length < 2) return false
  const first = s[0], last = s[s.length - 1]
  const spanDays = Math.round((new Date(last.date) - new Date(first.date)) / 86400000)
  return spanDays >= 14 && Math.abs(last.value - first.value) <= 0.3 + 1e-9
}

function sinceStart(ctx) {
  if (!ctx.startDate) return null
  const d = daysUntil(ctx.startDate, ctx.now)
  return d === null ? null : -d
}
// R02 - day 21 to 35 since the client started.
function r02(ctx) { const d = sinceStart(ctx); return d !== null && d >= 21 && d <= 35 }
// R03 - first 14 days.
function r03(ctx) { const d = sinceStart(ctx); return d !== null && d >= 0 && d < 14 }

const CHECKS = { R01: r01, R05: r05, R07: r07, R10: r10, R04: r04, R02: r02, R03: r03 }

function daysBetween(isoA, isoB) {
  const [ya, ma, da] = isoA.split('-').map(Number)
  const [yb, mb, db] = isoB.split('-').map(Number)
  return Math.round((new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da)) / 86400000)
}

/**
 * @param ctx { now, startDate, logs, habitLogs, assessment, cards, tappedAt }
 *   tappedAt: { [ruleId]: 'YYYY-MM-DD' } - when this device last opened that suggestion
 * @returns { ruleId, card } | null
 */
export function pickSuggestion(ctx) {
  const now = ctx.now || new Date()
  const full = { ...ctx, now }
  const today = localISODate(now)
  for (const ruleId of RULE_ORDER) {
    const card = (ctx.cards || []).find((c) => c.id === RULE_CARD[ruleId] && c.approved)
    if (!card) continue
    const tapped = ctx.tappedAt?.[ruleId]
    if (tapped && daysBetween(tapped, today) < TAP_COOLDOWN_DAYS) continue
    if (CHECKS[ruleId](full)) return { ruleId, card }
  }
  return null
}

export function wordCount(parts) {
  return (Array.isArray(parts) ? parts : [parts]).join(' ').trim().split(/\s+/).filter(Boolean).length
}
export const readMinutes = (words) => Math.max(1, Math.ceil(words / 200))

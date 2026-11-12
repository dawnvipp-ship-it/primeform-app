// Pure helpers behind the "Hành trình" card, the monthly view and the weekly
// habit dots. No React, no Supabase - everything takes plain rows so it can be
// checked in isolation.
//
// Dates are 'YYYY-MM-DD' strings in the client's LOCAL calendar. Never go
// through toISOString() for "today": in Vietnam (UTC+7) that rolls back a day
// between midnight and 7am (see lib/date.js).
import { localISODate } from './date'

// `assessmentKey` = the "ban đầu" value the coach typed in the first assessment;
// `targetKey` = the target the coach typed there. Waist has neither: its
// baseline is simply the first measurement.
export const JOURNEY_METRICS = [
  { key: 'weight', label: 'Cân nặng', unit: 'kg', assessmentKey: 'weight', targetKey: 'target_weight' },
  { key: 'body_fat', label: 'Body fat', unit: '%', assessmentKey: 'body_fat', targetKey: 'target_body_fat' },
  { key: 'waist', label: 'Vòng eo', unit: 'cm' },
]

// A measurement of 0 / blank / garbage means "not entered".
function pos(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function logsWith(logs, key) {
  return (logs || [])
    .filter((l) => pos(l[key]) !== null && l.log_date)
    .map((l) => ({ date: l.log_date, value: pos(l[key]) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * "Lần đầu" = the initial value from the first assessment if the coach entered
 * one, otherwise the first measurement in the progress logs.
 */
export function journeyFor(metric, assessment, logs) {
  const series = logsWith(logs, metric.key)
  const fromAssessment = metric.assessmentKey ? pos(assessment?.[metric.assessmentKey]) : null

  const baseline = fromAssessment !== null
    ? { value: fromAssessment, date: null, from: 'assessment' }
    : series.length > 0
      ? { value: series[0].value, date: series[0].date, from: 'log' }
      : null
  const last = series.length > 0 ? series[series.length - 1] : null
  const target = metric.targetKey ? pos(assessment?.[metric.targetKey]) : null

  if (!baseline || !last) return { metric, baseline, current: last, target, delta: null, progress: null, reached: false, single: false }

  // Baseline is the very measurement we'd call "current": nothing to compare yet.
  const single = baseline.from === 'log' && series.length === 1
  const delta = single ? null : last.value - baseline.value

  let progress = null
  if (target !== null && !single && baseline.value !== target) {
    progress = Math.max(0, Math.min(1, (baseline.value - last.value) / (baseline.value - target)))
  }
  // Past the target in the right direction counts as reached.
  const reached = target !== null && !single && (
    baseline.value > target ? last.value <= target : last.value >= target
  )
  return { metric, baseline, current: last, target, delta, progress, reached, single }
}

// ---------- months (calendar months) ----------

export const monthKeyOf = (iso) => String(iso || '').slice(0, 7)
export const currentMonthKey = (now = new Date()) => monthKeyOf(localISODate(now))
export const monthLabel = (key) => `Tháng ${key.slice(5, 7)}/${key.slice(0, 4)}`
export const monthStart = (key) => `${key}-01`

export function shiftMonth(key, n) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Newest first, at most `max` months back from now (the habit logs fetched for
// the Progress page cover the same window).
export function monthsToShow(now = new Date(), max = 6) {
  const cur = currentMonthKey(now)
  return Array.from({ length: max }, (_, i) => shiftMonth(cur, -i))
}

/**
 * How a metric moved inside one calendar month.
 *  end   = last measurement in the month
 *  start = last measurement BEFORE the month; else the assessment's initial
 *          value; else the first measurement inside the month (if different from end)
 * Returns null when there is no measurement in the month.
 */
export function monthChange(metric, assessment, logs, key) {
  const series = logsWith(logs, metric.key)
  const inMonth = series.filter((p) => monthKeyOf(p.date) === key)
  if (inMonth.length === 0) return null
  const end = inMonth[inMonth.length - 1]

  const before = series.filter((p) => p.date < monthStart(key))
  let start = null
  if (before.length > 0) start = { value: before[before.length - 1].value, label: 'đầu tháng' }
  else {
    const initial = metric.assessmentKey ? pos(assessment?.[metric.assessmentKey]) : null
    if (initial !== null) start = { value: initial, label: 'ban đầu' }
    else if (inMonth.length > 1) start = { value: inMonth[0].value, label: 'lần đo đầu tháng' }
  }
  return { end: end.value, start: start ? start.value : null, startLabel: start ? start.label : null,
    delta: start ? end.value - start.value : null }
}

/**
 * Sessions trained in a calendar month, from the studio's own records (pushed by
 * reception as { "2026-11": 9, ... }). null = the client is not linked to
 * reception / nothing synced yet, so the UI hides the row instead of showing 0.
 */
export function sessionsInMonth(monthly, key) {
  if (!monthly || typeof monthly !== 'object') return null
  const n = monthly[key]
  return Number.isFinite(n) ? n : 0
}

// ---------- habits ----------

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Days done in a calendar month, out of the days that have passed in it. */
export function habitMonth(habitLogs, habitKey, key, now = new Date()) {
  const done = new Set(
    (habitLogs || []).filter((l) => l.habit_key === habitKey && l.done && monthKeyOf(l.log_date) === key).map((l) => l.log_date)
  )
  const isCurrent = key === currentMonthKey(now)
  const scope = isCurrent ? now.getDate() : daysInMonth(key)
  return { done: done.size, scope, pct: scope > 0 ? Math.round((done.size / scope) * 100) : 0 }
}

/** The last 7 days ending today, oldest first. */
export function lastSevenDays(habitLogs, habitKey, now = new Date()) {
  const doneDates = new Set(
    (habitLogs || []).filter((l) => l.habit_key === habitKey && l.done).map((l) => l.log_date)
  )
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = localISODate(d)
    out.push({ date, done: doneDates.has(date), isToday: i === 0 })
  }
  return out
}

/** "-3.2" / "+1.0" with the metric's unit; null when there is no change to show. */
export function formatDelta(delta, unit) {
  if (delta === null || delta === undefined) return null
  const r = Math.round(delta * 10) / 10
  if (r === 0) return `giữ nguyên`
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(1)} ${unit}`
}

export const fmt = (v) => {
  const n = Number(v)
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

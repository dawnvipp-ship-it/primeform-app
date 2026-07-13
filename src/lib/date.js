// Local calendar date as YYYY-MM-DD. Never use `new Date().toISOString()`
// for "today"/"now" comparisons - it converts to UTC first, which silently
// rolls back to the previous day for anyone in a positive UTC-offset
// timezone (Vietnam, UTC+7) between midnight and ~7am local time.
export function localISODate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

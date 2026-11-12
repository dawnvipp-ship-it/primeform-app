// Remembers, on THIS device only, when a suggestion was last opened so the same
// card is not pushed again for 14 days (see guideRules.TAP_COOLDOWN_DAYS).
// localStorage, not the database: the Cẩm nang spec keeps read-state out of the
// database. Keyed per client so a coach previewing several clients in one browser
// does not suppress anyone's suggestions. Every access is wrapped: private windows
// and blocked storage must never break the dashboard.
import { localISODate } from './date'

const key = (clientId) => `pf-guide-tapped:${clientId}`

export function getTapped(clientId) {
  try { return JSON.parse(localStorage.getItem(key(clientId)) || '{}') || {} } catch { return {} }
}

export function markTapped(clientId, ruleId) {
  try {
    const m = getTapped(clientId)
    m[ruleId] = localISODate()
    localStorage.setItem(key(clientId), JSON.stringify(m))
  } catch { /* optional convenience */ }
}

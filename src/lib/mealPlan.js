// Pure helpers for the client's Nutrition page. They only READ the coach's meal
// plan text/macros and rearrange it for display - nothing here estimates the
// nutrition of a dish (a free-text "cơm 2.5 chén + bò xào 120g" cannot be
// measured reliably, so we never show invented per-food numbers).

const WEEKDAY_TOKEN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] // index = Date.getDay()

const stripMarks = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toUpperCase()

/** Index of today's tab, matched by the weekday at the start of the label ("T2 · REST"). null = no match. */
export function todayDayIndex(days, now = new Date()) {
  const token = WEEKDAY_TOKEN[now.getDay()]
  const i = (days || []).findIndex((d) => new RegExp(`^\\s*${token}(?![A-Z0-9])`).test(stripMarks(d.label)))
  return i >= 0 ? i : null
}

/** A tab labelled REST / NGHỈ is a rest day; any other label counts as a training day. */
export function isRestDay(label) {
  return /(^|[^A-Z])(REST|NGHI)([^A-Z]|$)/.test(stripMarks(label))
}

const MEAL_LINE = /^\s*B[uữ]a\s*(\d+)\s*(?:\(([^)]*)\))?\s*:\s*(.*)$/i

/**
 * "Bữa 1 (7:00): Phở bò + 1 trứng" lines -> [{ n, time, items: [{ main, detail }], more: [] }].
 * A line that is not a "Bữa" line continues the previous meal. Returns null when
 * the text does not look like that format at all, so the caller can show it unchanged.
 */
export function parseMeals(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const meals = []
  for (const line of lines) {
    const m = MEAL_LINE.exec(line)
    if (m) {
      const items = m[3].split(/\s\+\s/).map((s) => s.trim()).filter(Boolean).map((s) => {
        const [main, ...rest] = s.split(/\s·\s/)
        return { main: main.trim(), detail: rest.join(' · ').trim() }
      })
      meals.push({ n: Number(m[1]), time: (m[2] || '').trim(), items, more: [] })
    } else if (meals.length > 0) {
      meals[meals.length - 1].more.push(line)
    } else {
      return null
    }
  }
  return meals.length > 0 ? meals : null
}

const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Daily macros split evenly over `mealCount` meals - an average, not a food's content. null if anything is missing. */
export function perMealAverage(macros, mealCount) {
  if (!macros || !(mealCount >= 1)) return null
  const cal = num(macros.calories), p = num(macros.protein), c = num(macros.carbs), f = num(macros.fat)
  if (cal === null || p === null || c === null || f === null || cal === 0) return null
  return {
    calories: Math.round(cal / mealCount), protein: Math.round(p / mealCount),
    carbs: Math.round(c / mealCount), fat: Math.round(f / mealCount),
  }
}

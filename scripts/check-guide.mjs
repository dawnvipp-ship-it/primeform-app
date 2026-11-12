// Build-time gate for Cẩm nang content. `npm run build` runs this first (see the
// "prebuild" script), so a card that breaks the rules cannot be deployed.
// Unapproved cards are drafts and only need a unique id and a valid group.
import { GUIDE_CARDS, GUIDE_GROUPS, GUIDE_SAFETY } from '../src/data/guide.js'

const MIN_WORDS = 120
const MAX_WORDS = 200
const BANNED = ['đảm bảo', 'tuyệt vời nhất', 'tốt nhất', '100%', 'chắc chắn sẽ', 'cam kết']
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

const errors = []
const ids = new Set()
const groups = new Set(GUIDE_GROUPS.map((g) => g.key))
const words = (parts) => parts.join(' ').trim().split(/\s+/).filter(Boolean).length

for (const c of GUIDE_CARDS) {
  const at = `${c.id || '(no id)'}`
  if (!c.id || ids.has(c.id)) errors.push(`${at}: id missing or duplicated`)
  ids.add(c.id)
  if (!groups.has(c.group)) errors.push(`${at}: unknown group "${c.group}"`)
  if (!c.approved) continue

  const n = words(c.body || [])
  if (n < MIN_WORDS || n > MAX_WORDS) errors.push(`${at}: ${n} words, must be ${MIN_WORDS}-${MAX_WORDS}`)
  if (!c.title?.trim()) errors.push(`${at}: title missing`)
  if (!c.summary?.trim()) errors.push(`${at}: summary missing`)
  if (!c.action?.trim()) errors.push(`${at}: "việc nhỏ hôm nay" missing`)
  if (!GUIDE_SAFETY.trim()) errors.push('GUIDE_SAFETY note is empty')
  const text = [c.title, c.summary, ...(c.body || []), c.action].join(' ').toLowerCase()
  for (const w of BANNED) if (text.includes(w)) errors.push(`${at}: contains banned wording "${w}"`)
  if (EMOJI.test(text)) errors.push(`${at}: contains an emoji`)
}

if (errors.length) {
  console.error('\nCẩm nang content check FAILED:\n' + errors.map((e) => ' - ' + e).join('\n') + '\n')
  process.exit(1)
}
const approved = GUIDE_CARDS.filter((c) => c.approved).length
console.log(`Cẩm nang content check OK (${GUIDE_CARDS.length} cards, ${approved} approved)`)

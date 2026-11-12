import { useState } from 'react'
import { Card, Eyebrow, showToast } from './primitives'
import { fmt } from '../../lib/journey'
import { localISODate } from '../../lib/date'

const MIN_KG = 20
const MAX_KG = 400
const WEEK_MS = 7 * 86400000

// Client self-weigh-in. Entries are labelled as self-reported everywhere so they
// are never mistaken for the coach's measurements.
export default function WeighIn({ entries, onSave }) {
  const today = localISODate()
  const latest = entries.length > 0 ? entries[entries.length - 1] : null
  const todays = latest && latest.log_date === today ? latest : null
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const lastTime = latest ? new Date(latest.log_date + 'T00:00:00').getTime() : null
  const stale = lastTime === null || Date.now() - lastTime > WEEK_MS

  async function submit(e) {
    e.preventDefault()
    const kg = Number(String(text).replace(',', '.'))
    if (!Number.isFinite(kg) || kg < MIN_KG || kg > MAX_KG) { showToast(`Cân nặng cần nằm trong khoảng ${MIN_KG}–${MAX_KG} kg.`); return }
    setBusy(true)
    try { await onSave(Math.round(kg * 10) / 10); setText('') }
    catch (err) { showToast(err.message || 'Không lưu được, thử lại.') }
    finally { setBusy(false) }
  }

  return (
    <Card className="stack">
      <div className="row-between">
        <Eyebrow>Cân nặng của bạn</Eyebrow>
        {stale && <span className="tag tag-accent">Tuần này chưa cân</span>}
      </div>
      <div className="faint" style={{ fontSize: 12.5 }}>
        {latest
          ? `Lần tự cân gần nhất: ${fmt(latest.weight)} kg · ${todays ? 'hôm nay' : latest.log_date.split('-').reverse().join('/')}`
          : 'Cân mỗi tuần một lần, vào buổi sáng trước khi ăn, để số liệu ổn định.'}
      </div>
      <form onSubmit={submit} className="row" style={{ gap: 10 }}>
        <input
          className="input" type="text" inputMode="decimal" autoComplete="off"
          placeholder={todays ? `Sửa số hôm nay (${fmt(todays.weight)})` : 'VD: 65.4'}
          value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} aria-label="Cân nặng (kg)"
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !text.trim()}>{busy ? 'Đang lưu…' : todays ? 'Cập nhật' : 'Lưu'}</button>
      </form>
      <div className="faint" style={{ fontSize: 11.5 }}>Số bạn tự nhập được ghi nhãn "tự nhập", tách khỏi số HLV đo.</div>
    </Card>
  )
}

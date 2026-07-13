import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { listMyBookings, listSlotsForRange, createBooking, cancelMyBooking, SLOT_HOURS } from '../../data/bookings'
import { SkeletonScreen, Eyebrow, Card, Empty, Modal, Field, Textarea, confirmDialog, showToast } from '../../components/ui/primitives'
import { IconCalendar } from '../../components/ui/Icons'
import SessionRing from '../../components/ui/SessionRing'
import { localISODate } from '../../lib/date'

const STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ', completed: 'Đã tập', no_show: 'Vắng' }
const STATUS_COLOR = { pending: 'var(--pf-accent)', confirmed: 'var(--pf-ok)', cancelled: 'var(--pf-danger)', completed: 'var(--pf-muted)', no_show: 'var(--pf-danger)' }

function StatusTag({ status }) {
  const color = STATUS_COLOR[status] ?? 'var(--pf-muted)'
  return <span className="tag" style={{ color, borderColor: color }}>{STATUS_LABEL[status] ?? status}</span>
}

function nextDays(n) {
  const out = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    out.push(localISODate(d))
  }
  return out
}

function formatDateLabel(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

const DAY_ABBREV = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
function dayAbbrev(iso) {
  const d = new Date(iso + 'T00:00:00')
  return DAY_ABBREV[d.getDay()]
}
function dayNumber(iso) {
  return iso.slice(8, 10) + '/' + iso.slice(5, 7)
}

export default function Sessions() {
  const { db } = useAuth()
  const { data, loading, reload } = useAsync(async () => {
    const me = await getMyClient(db)
    const bookings = me ? await listMyBookings(db) : []
    return { me, bookings }
  }, [db])

  const me = data?.me
  const myBookings = data?.bookings ?? []

  const days = useMemo(() => nextDays(14), [])
  const [showBooking, setShowBooking] = useState(false)
  const [selectedDate, setSelectedDate] = useState(days[0])
  const [selectedTime, setSelectedTime] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const { data: takenSlots } = useAsync(
    () => (me?.coach ? listSlotsForRange(db, me.coach, selectedDate, selectedDate) : Promise.resolve([])),
    [db, me?.coach, selectedDate]
  )
  const takenTimes = new Set((takenSlots ?? []).map((s) => s.time))

  const openBooking = useCallback(() => {
    setSelectedDate(days[0]); setSelectedTime(null); setNotes(''); setErr(''); setShowBooking(true)
  }, [days])

  async function submitBooking(e) {
    e.preventDefault()
    if (!selectedTime) { setErr('Chọn giờ trống trước đã.'); return }
    setBusy(true); setErr('')
    try {
      await createBooking(db, { clientId: me.id, coach: me.coach, date: selectedDate, time: selectedTime, notes })
      setShowBooking(false)
      await reload()
    } catch (e2) {
      // 23505 = unique_violation (bookings_slot_unique) - someone else took
      // this exact slot between when it loaded and when this submitted.
      const msg = e2.code === '23505'
        ? 'Giờ này vừa có người đặt mất rồi, chọn giờ khác nhé.'
        : (e2.message || 'Không đặt được lịch, thử lại.')
      setErr(msg)
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id) {
    const ok = await confirmDialog('Huỷ buổi tập này?', { confirmLabel: 'Huỷ buổi tập', danger: true })
    if (!ok) return
    try {
      await cancelMyBooking(db, id)
      await reload()
    } catch (e) {
      showToast(e.message || 'Không huỷ được, thử lại.')
    }
  }

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  if (!me) return <div className="screen"><Empty title="Không tìm thấy hồ sơ." /></div>

  const pct = me.total_sessions > 0 ? Math.round((me.used_sessions / me.total_sessions) * 100) : 0
  const upcoming = myBookings.filter((b) => b.status === 'pending' || b.status === 'confirmed')

  return (
    <div className="screen stack-lg fade-in">
      <div>
        <Eyebrow>Gói tập</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Buổi tập</h1>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'center', padding: '36px 24px' }}>
        <SessionRing total={me.total_sessions} used={me.used_sessions} size={240} />
      </Card>

      <Card className="stack">
        <div className="row-between">
          <span className="kv-label">Đã hoàn thành</span>
          <span className="kv-value">{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--pf-line)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--pf-accent)', transition: 'width .8s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="kv"><span className="kv-label">Trọn gói</span><span className="kv-value">{me.total_sessions} buổi</span></div>
          <div className="kv"><span className="kv-label">Đã tập</span><span className="kv-value">{me.used_sessions} buổi</span></div>
          <div className="kv"><span className="kv-label">Còn lại</span><span className="kv-value" style={{ color: 'var(--pf-accent)' }}>{me.remaining_sessions} buổi</span></div>
        </div>
      </Card>

      <Card className="stack">
        <div className="row-between">
          <Eyebrow>Đặt lịch</Eyebrow>
          {me.coach && (
            <button className="btn btn-primary btn-sm" onClick={openBooking}>
              <IconCalendar style={{ width: 16, height: 16, marginRight: 6, verticalAlign: -3 }} />
              Đặt lịch mới
            </button>
          )}
        </div>

        {!me.coach ? (
          <Empty title="Chưa có HLV phụ trách" hint="Liên hệ lễ tân để được phân công HLV trước khi đặt lịch." />
        ) : upcoming.length === 0 ? (
          <Empty title="Chưa có buổi nào" hint="Bấm 'Đặt lịch mới' để chọn giờ tập với HLV." />
        ) : (
          <div className="stack">
            {upcoming.map((b) => (
              <div key={b.id} className="row-between" style={{ borderBottom: '1px solid var(--pf-line-soft)', paddingBottom: 10 }}>
                <div>
                  <div className="kv-value">{formatDateLabel(b.date)} · {b.time}</div>
                  <StatusTag status={b.status} />
                </div>
                <button className="btn-quiet" onClick={() => cancel(b.id)}>Huỷ</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showBooking} onClose={() => setShowBooking(false)} title="Đặt lịch tập">
        <form onSubmit={submitBooking} className="stack">
          <Field label="Chọn ngày">
            <div className="row hide-scrollbar" style={{ gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {days.map((d) => (
                <button
                  type="button" key={d}
                  className={d === selectedDate ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
                  style={{ flexShrink: 0, flexDirection: 'column', gap: 2, minWidth: 56, padding: '8px 10px' }}
                >
                  <span style={{ fontSize: 11, opacity: 0.75 }}>{dayAbbrev(d)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{dayNumber(d)}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Chọn giờ (7:00 - 21:00)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {SLOT_HOURS.map((h) => {
                const t = `${String(h).padStart(2, '0')}:00`
                const taken = takenTimes.has(t)
                return (
                  <button
                    type="button" key={t} disabled={taken}
                    className={t === selectedTime ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                    style={taken ? { color: 'var(--pf-faint)', borderColor: 'transparent', textDecoration: 'line-through' } : undefined}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Ghi chú (không bắt buộc)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>

          {err && <div style={{ color: 'var(--pf-danger)', fontSize: 13 }}>{err}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

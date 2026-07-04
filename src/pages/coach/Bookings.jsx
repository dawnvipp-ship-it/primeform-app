import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listCoachBookings, confirmBooking, rejectBooking, groupWeeklyTotalsByCoach } from '../../data/bookings'
import { InlineLoader, Eyebrow, Card, Empty, Stat } from '../../components/ui/primitives'
import { IconChevron, IconCheck, IconX } from '../../components/ui/Icons'

const STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ', completed: 'Đã tập', no_show: 'Vắng' }
const STATUS_COLOR = { pending: 'var(--pf-accent)', confirmed: 'var(--pf-ok)', cancelled: 'var(--pf-danger)', completed: 'var(--pf-muted)', no_show: 'var(--pf-danger)' }

function StatusTag({ status }) {
  const color = STATUS_COLOR[status] ?? 'var(--pf-muted)'
  return <span className="tag" style={{ color, borderColor: color }}>{STATUS_LABEL[status] ?? status}</span>
}

function mondayOf(d) {
  const x = new Date(d)
  const day = x.getDay() // 0 = Sun .. 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function toISO(d) { return d.toISOString().slice(0, 10) }
function formatShort(d) { return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }

export default function Bookings() {
  const { db, isHeadCoach, coachFullName } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStartDate = useMemo(() => addDays(mondayOf(new Date()), weekOffset * 7), [weekOffset])
  const weekEndDate = useMemo(() => addDays(weekStartDate, 6), [weekStartDate])
  const weekStart = toISO(weekStartDate)
  const weekEnd = toISO(weekEndDate)

  const { data: pending, loading: loadingPending, reload: reloadPending } = useAsync(
    () => listCoachBookings(db, { status: 'pending' }),
    [db]
  )
  const { data: weekBookings, loading: loadingWeek, reload: reloadWeek } = useAsync(
    () => listCoachBookings(db, { from: weekStart, to: weekEnd }),
    [db, weekStart, weekEnd]
  )

  async function act(id, fn) {
    await fn(db, id)
    await Promise.all([reloadPending(), reloadWeek()])
  }

  const weekTotal = (weekBookings ?? []).filter((b) => b.status !== 'cancelled').length
  const coachTotals = isHeadCoach ? groupWeeklyTotalsByCoach(weekBookings ?? []) : null

  return (
    <div className="coach-screen stack">
      <div>
        <Eyebrow>Lịch tập</Eyebrow>
        <h1 style={{ fontSize: 26, marginTop: 6 }}>Đặt lịch</h1>
      </div>

      <Card className="stack">
        <Eyebrow muted>Chờ xác nhận</Eyebrow>
        {loadingPending ? <InlineLoader /> : (pending?.length ?? 0) === 0 ? (
          <Empty title="Không có yêu cầu nào đang chờ" />
        ) : (
          <div className="stack">
            {pending.map((b) => (
              <div key={b.id} className="row-between" style={{ borderBottom: '1px solid var(--pf-line-soft)', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{formatShort(new Date(`${b.date}T00:00:00`))} · {b.time}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {isHeadCoach ? b.coach_id : coachFullName}{b.notes ? ` · ${b.notes}` : ''}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn-quiet" style={{ color: 'var(--pf-ok)' }} onClick={() => act(b.id, confirmBooking)} title="Xác nhận">
                    <IconCheck width={16} height={16} />
                  </button>
                  <button className="btn-quiet" style={{ color: 'var(--pf-danger)' }} onClick={() => act(b.id, rejectBooking)} title="Từ chối">
                    <IconX width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="stack">
        <div className="row-between">
          <button className="btn-quiet" onClick={() => setWeekOffset((w) => w - 1)} title="Tuần trước">
            <IconChevron style={{ transform: 'rotate(180deg)' }} />
          </button>
          <Eyebrow muted>
            {weekOffset === 0 ? 'Tuần này' : `${formatShort(weekStartDate)} - ${formatShort(weekEndDate)}`}
          </Eyebrow>
          <button className="btn-quiet" onClick={() => setWeekOffset((w) => w + 1)} title="Tuần sau">
            <IconChevron />
          </button>
        </div>

        <Stat value={weekTotal} label="Tổng buổi đã book tuần này" />

        {isHeadCoach && coachTotals && Object.keys(coachTotals).length > 0 && (
          <div className="stack" style={{ marginTop: 4 }}>
            {Object.entries(coachTotals).map(([coach, total]) => (
              <div key={coach} className="kv"><span className="kv-label">{coach}</span><span className="kv-value">{total} buổi</span></div>
            ))}
          </div>
        )}

        {loadingWeek ? <InlineLoader /> : (weekBookings?.length ?? 0) === 0 ? (
          <Empty title="Không có buổi nào trong tuần này" />
        ) : (
          <div className="stack">
            {weekBookings.map((b) => (
              <div key={b.id} className="row-between" style={{ borderBottom: '1px solid var(--pf-line-soft)', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{formatShort(new Date(`${b.date}T00:00:00`))} · {b.time}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{isHeadCoach ? b.coach_id : coachFullName}</div>
                </div>
                <StatusTag status={b.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

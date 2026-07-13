import { Fragment, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listCoachBookings, confirmBooking, rejectBooking, groupWeeklyTotalsByCoach, SLOT_HOURS } from '../../data/bookings'
import { COACHES } from '../../data/coaches'
import { InlineLoader, Eyebrow, Card, Empty, Stat, showToast } from '../../components/ui/primitives'
import { IconChevron, IconCheck, IconX } from '../../components/ui/Icons'
import { localISODate } from '../../lib/date'

const STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ', completed: 'Đã tập', no_show: 'Vắng' }
const STATUS_COLOR = { pending: 'var(--pf-accent)', confirmed: 'var(--pf-ok)', cancelled: 'var(--pf-danger)', completed: 'var(--pf-muted)', no_show: 'var(--pf-danger)' }
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function mondayOf(d) {
  const x = new Date(d)
  const day = x.getDay() // 0 = Sun .. 6 = Sat
  const diff = (day === 0 ? -6 : 1) - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function monthStartOf(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function monthEndOf(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const toISO = localISODate
function formatShort(d) { return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) }
function formatMonthLabel(d) { return d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) }
function shortName(full) { return full ? full.split(' ').slice(-1)[0] : '' }

export default function Bookings() {
  const { db, isHeadCoach, coachFullName } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  // 'all' (whole-studio) or one coach's full_name — only ever meaningful for
  // the head coach; a regular coach's data is already RLS-scoped to just
  // their own bookings, so there's nothing to switch between for them.
  // Shared by both the weekly grid and the monthly summary below.
  const [selectedView, setSelectedView] = useState('all')

  const weekStartDate = useMemo(() => addDays(mondayOf(new Date()), weekOffset * 7), [weekOffset])
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)), [weekStartDate])
  const weekStart = toISO(weekDates[0])
  const weekEnd = toISO(weekDates[6])

  const monthDate = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset])
  const monthStart = toISO(monthStartOf(monthDate))
  const monthEnd = toISO(monthEndOf(monthDate))

  const { data: pending, loading: loadingPending, reload: reloadPending } = useAsync(
    () => listCoachBookings(db, { status: 'pending' }),
    [db]
  )
  const { data: weekBookings, loading: loadingWeek, reload: reloadWeek } = useAsync(
    () => listCoachBookings(db, { from: weekStart, to: weekEnd }),
    [db, weekStart, weekEnd]
  )
  const { data: monthBookings, loading: loadingMonth } = useAsync(
    () => listCoachBookings(db, { from: monthStart, to: monthEnd }),
    [db, monthStart, monthEnd]
  )

  async function act(id, fn) {
    try {
      await fn(db, id)
      await Promise.all([reloadPending(), reloadWeek()])
    } catch (e) {
      showToast(e.message || 'Không thực hiện được, thử lại.')
    }
  }

  const viewBookings = useMemo(() => {
    const all = weekBookings ?? []
    if (!isHeadCoach || selectedView === 'all') return all
    return all.filter((b) => b.coach_id === selectedView)
  }, [weekBookings, isHeadCoach, selectedView])

  // date -> time -> [bookings], for the grid lookup below.
  const grid = useMemo(() => {
    const g = {}
    for (const b of viewBookings) {
      if (b.status === 'cancelled') continue
      g[b.date] ??= {}
      g[b.date][b.time] ??= []
      g[b.date][b.time].push(b)
    }
    return g
  }, [viewBookings])

  const weekTotal = viewBookings.filter((b) => b.status !== 'cancelled').length
  const coachTotals = isHeadCoach ? groupWeeklyTotalsByCoach(weekBookings ?? []) : null

  const viewMonthBookings = useMemo(() => {
    const all = monthBookings ?? []
    if (!isHeadCoach || selectedView === 'all') return all
    return all.filter((b) => b.coach_id === selectedView)
  }, [monthBookings, isHeadCoach, selectedView])
  const monthTotal = viewMonthBookings.filter((b) => b.status !== 'cancelled').length
  const monthCoachTotals = isHeadCoach ? groupWeeklyTotalsByCoach(monthBookings ?? []) : null

  return (
    <div className="coach-screen stack">
      <div>
        <Eyebrow>Lịch tập</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Đặt lịch</h1>
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
                  <div style={{ fontWeight: 600 }}>{formatShort(new Date(`${b.date}T00:00:00`))} · {b.time} · {b.client_name ?? '—'}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {isHeadCoach ? shortName(b.coach_id) : shortName(coachFullName)}{b.notes ? ` · ${b.notes}` : ''}
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
            {weekOffset === 0 ? 'Tuần này' : `${formatShort(weekDates[0])} - ${formatShort(weekDates[6])}`}
          </Eyebrow>
          <button className="btn-quiet" onClick={() => setWeekOffset((w) => w + 1)} title="Tuần sau">
            <IconChevron />
          </button>
        </div>

        {isHeadCoach && (
          <div className="seg-tabs">
            <button className={`seg-tab${selectedView === 'all' ? ' active' : ''}`} onClick={() => setSelectedView('all')}>
              Tổng cả phòng
            </button>
            {COACHES.map((c) => (
              <button key={c} className={`seg-tab${selectedView === c ? ' active' : ''}`} onClick={() => setSelectedView(c)}>
                {shortName(c)}
              </button>
            ))}
          </div>
        )}

        <Stat
          value={weekTotal}
          label={isHeadCoach && selectedView === 'all' ? 'Tổng buổi cả phòng tuần này' : 'Tổng buổi đã book tuần này'}
        />

        {isHeadCoach && selectedView === 'all' && coachTotals && Object.keys(coachTotals).length > 0 && (
          <div className="stack" style={{ marginTop: 4 }}>
            {Object.entries(coachTotals).map(([coach, total]) => (
              <div key={coach} className="kv"><span className="kv-label">{coach}</span><span className="kv-value">{total} buổi</span></div>
            ))}
          </div>
        )}

        {loadingWeek ? <InlineLoader /> : (
          <div style={{ overflowX: 'auto', marginTop: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, minmax(96px, 1fr))', minWidth: 760 }}>
              <div />
              {weekDates.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid var(--pf-line)' }}>
                  <div className="eyebrow eyebrow-muted" style={{ fontSize: 10 }}>{DAY_LABELS[i]}</div>
                  <div style={{ fontSize: 12 }}>{formatShort(d)}</div>
                </div>
              ))}

              {SLOT_HOURS.map((h) => {
                const t = `${String(h).padStart(2, '0')}:00`
                return (
                  <Fragment key={h}>
                    <div style={{ fontSize: 11, color: 'var(--pf-faint)', padding: '6px 4px', borderTop: '1px solid var(--pf-line-soft)' }}>
                      {t}
                    </div>
                    {weekDates.map((d, i) => {
                      const iso = toISO(d)
                      const cellBookings = grid[iso]?.[t] ?? []
                      return (
                        <div
                          key={i}
                          style={{
                            borderTop: '1px solid var(--pf-line-soft)', borderLeft: '1px solid var(--pf-line-soft)',
                            padding: 3, minHeight: 34,
                          }}
                        >
                          {cellBookings.map((b) => (
                            <div
                              key={b.id}
                              title={`${b.client_name ?? ''} · ${STATUS_LABEL[b.status] ?? b.status}`}
                              style={{
                                fontSize: 10, borderRadius: 6, padding: '2px 5px', marginBottom: 2,
                                color: STATUS_COLOR[b.status] ?? 'var(--pf-muted)',
                                border: `1px solid ${STATUS_COLOR[b.status] ?? 'var(--pf-line)'}`,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}
                            >
                              {b.client_name ?? '—'}
                              {isHeadCoach && selectedView === 'all' ? ` (${shortName(b.coach_id)})` : ''}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <Card className="stack">
        <div className="row-between">
          <button className="btn-quiet" onClick={() => setMonthOffset((m) => m - 1)} title="Tháng trước">
            <IconChevron style={{ transform: 'rotate(180deg)' }} />
          </button>
          <Eyebrow muted>{formatMonthLabel(monthDate)}</Eyebrow>
          <button className="btn-quiet" onClick={() => setMonthOffset((m) => m + 1)} title="Tháng sau">
            <IconChevron />
          </button>
        </div>

        {loadingMonth ? <InlineLoader /> : (
          <>
            <Stat
              value={monthTotal}
              label={isHeadCoach && selectedView === 'all' ? 'Tổng buổi cả phòng trong tháng' : 'Tổng buổi đã book trong tháng'}
            />
            {isHeadCoach && selectedView === 'all' && monthCoachTotals && Object.keys(monthCoachTotals).length > 0 && (
              <div className="stack" style={{ marginTop: 4 }}>
                {Object.entries(monthCoachTotals).map(([coach, total]) => (
                  <div key={coach} className="kv"><span className="kv-label">{coach}</span><span className="kv-value">{total} buổi</span></div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

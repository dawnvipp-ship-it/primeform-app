import { Fragment, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import {
  listCoachBookings, confirmBooking, rejectBooking, createCoachBooking, findSlotClashes,
  groupWeeklyTotalsByCoach, SLOT_TIMES,
} from '../../data/bookings'
import { listClients } from '../../data/clients'
import { COACHES } from '../../data/coaches'
import { InlineLoader, Eyebrow, Card, Empty, Stat, Modal, showToast, confirmDialog } from '../../components/ui/primitives'
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
function dayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return `${DAY_LABELS[(d.getDay() + 6) % 7]} ${formatShort(d)}`
}
// Accent-insensitive match so typing "quy" finds "Quý", "dung" finds "Dũng".
function fold(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
}
const REPEAT_OPTIONS = [1, 4, 8]

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
  const { data: monthBookings, loading: loadingMonth, reload: reloadMonth } = useAsync(
    () => listCoachBookings(db, { from: monthStart, to: monthEnd }),
    [db, monthStart, monthEnd]
  )
  // RLS already scopes this to the caller's own clients (everyone, for the head coach).
  const { data: clients } = useAsync(() => listClients(db), [db])

  // Whose calendar a new booking lands on. A regular coach only ever books
  // their own; the head coach picks a coach tab first - in the whole-studio
  // view there's no single calendar to add to, so the grid stays read-only.
  const bookingCoach = isHeadCoach ? (selectedView === 'all' ? null : selectedView) : coachFullName
  const [draft, setDraft] = useState(null) // { date, time, clientId, repeat, search }
  const [saving, setSaving] = useState(false)
  const [picked, setPicked] = useState(null) // existing booking opened from the grid

  async function act(id, fn) {
    try {
      await fn(db, id)
      await Promise.all([reloadPending(), reloadWeek(), reloadMonth()])
    } catch (e) {
      showToast(e.message || 'Không thực hiện được, thử lại.')
    }
  }

  function openDraft(date, time) {
    if (!bookingCoach) { showToast('Chọn tab của một HLV để nhập lịch.'); return }
    setDraft({ date, time, clientId: null, repeat: 1, search: '' })
  }

  // One insert per week. A slot that's already taken is skipped and reported
  // rather than aborting the whole series; any other error stops it.
  async function saveDraft() {
    if (!draft?.clientId || !bookingCoach || saving) return
    setSaving(true)
    const start = new Date(`${draft.date}T00:00:00`)
    let saved = 0
    const skipped = []
    let failure = null
    for (let i = 0; i < draft.repeat; i++) {
      const day = addDays(start, i * 7)
      try {
        await createCoachBooking(db, { clientId: draft.clientId, coach: bookingCoach, date: toISO(day), time: draft.time })
        saved++
      } catch (e) {
        if (e.code === '23505') skipped.push(formatShort(day))
        else { failure = e; break }
      }
    }
    setSaving(false)
    if (saved > 0) await Promise.all([reloadWeek(), reloadMonth()])
    if (failure) {
      showToast(failure.code === '42501' ? 'Không có quyền nhập lịch cho khách này.' : (failure.message || 'Không lưu được, thử lại.'))
      if (saved === 0) return
    } else if (skipped.length) {
      showToast(`Đã lưu ${saved} buổi. Bỏ qua ${skipped.length} buổi đã có lịch: ${skipped.join(', ')}`)
    } else {
      showToast(saved > 1 ? `Đã lưu ${saved} buổi` : 'Đã lưu lịch')
    }
    setDraft(null)
  }

  async function cancelPicked() {
    const b = picked
    if (!b) return
    // Close this sheet first - the confirm dialog is its own modal.
    setPicked(null)
    const ok = await confirmDialog(
      `Huỷ lịch của ${b.client_name ?? 'khách'} lúc ${b.time} ${dayLabel(b.date)}?`,
      { title: 'Huỷ lịch tập', danger: true, confirmLabel: 'Huỷ lịch' }
    )
    if (ok) await act(b.id, rejectBooking)
  }

  const coachClients = useMemo(() => {
    if (!bookingCoach) return []
    return (clients || [])
      .filter((c) => c.coach === bookingCoach && c.active !== false)
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'vi'))
  }, [clients, bookingCoach])
  const draftClients = draft ? coachClients.filter((c) => fold(c.full_name).includes(fold(draft.search))) : []
  const draftClash = draft && bookingCoach
    ? findSlotClashes(weekBookings, bookingCoach, draft.date, draft.time)
    : { exact: null, near: [] }

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

        <div className="muted" style={{ fontSize: 12 }}>
          {bookingCoach
            ? 'Bấm vào ô trống để nhập lịch cho khách. Bấm vào tên khách để xem hoặc huỷ.'
            : 'Chọn tab của một HLV để nhập lịch. Bấm vào tên khách để xem hoặc huỷ.'}
        </div>

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

              {SLOT_TIMES.map((t) => {
                // On-the-hour rows get the visible border/label; :30 rows sit
                // quietly between them so the now-27-row grid (was 14, hourly
                // only) doesn't read as a denser wall of identical lines.
                const onHour = t.endsWith(':00')
                return (
                  <Fragment key={t}>
                    <div style={{
                      fontSize: 11, color: onHour ? 'var(--pf-faint)' : 'var(--pf-line)', padding: '6px 4px',
                      borderTop: onHour ? '1px solid var(--pf-line-soft)' : 'none',
                    }}>
                      {t}
                    </div>
                    {weekDates.map((d, i) => {
                      const iso = toISO(d)
                      const cellBookings = grid[iso]?.[t] ?? []
                      return (
                        <div
                          key={i}
                          className={cellBookings.length === 0 ? 'slot-cell-add' : undefined}
                          onClick={cellBookings.length === 0 ? () => openDraft(iso, t) : undefined}
                          style={{
                            borderTop: onHour ? '1px solid var(--pf-line-soft)' : 'none',
                            borderLeft: '1px solid var(--pf-line-soft)',
                            padding: 3, minHeight: 28,
                          }}
                        >
                          {cellBookings.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => setPicked(b)}
                              title={`${b.client_name ?? ''} · ${STATUS_LABEL[b.status] ?? b.status}`}
                              style={{
                                cursor: 'pointer',
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

      <Modal open={!!draft} onClose={() => { if (!saving) setDraft(null) }} title="Nhập lịch tập">
        {draft && (
          <div className="stack">
            <div className="muted" style={{ fontSize: 13 }}>
              {dayLabel(draft.date)} · HLV {shortName(bookingCoach)}
            </div>

            <div>
              <div className="eyebrow eyebrow-muted" style={{ marginBottom: 6 }}>Giờ bắt đầu · buổi 60 phút</div>
              <select
                className="select"
                value={draft.time}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              >
                {SLOT_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {draftClash.exact && (
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--pf-danger)' }}>
                Giờ này đã có lịch của {draftClash.exact.client_name ?? 'khách khác'}. Chọn giờ khác.
              </p>
            )}
            {!draftClash.exact && draftClash.near.length > 0 && (
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--pf-accent)' }}>
                Chồng giờ với {draftClash.near.map((b) => `${b.client_name ?? 'khách'} lúc ${b.time}`).join(', ')}. Vẫn lưu được.
              </p>
            )}

            <div>
              <div className="eyebrow eyebrow-muted" style={{ marginBottom: 6 }}>Khách hàng</div>
              <input
                className="input"
                placeholder="Tìm tên khách…"
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              />
              <div style={{ marginTop: 8, maxHeight: 232, overflowY: 'auto', border: '1px solid var(--pf-line)', borderRadius: 10 }}>
                {draftClients.length === 0 ? (
                  <div className="muted" style={{ padding: 14, fontSize: 13 }}>
                    {coachClients.length === 0 ? 'HLV này chưa có khách nào.' : 'Không tìm thấy khách phù hợp.'}
                  </div>
                ) : draftClients.map((c) => {
                  const selected = draft.clientId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, clientId: c.id }))}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                        width: '100%', padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
                        background: selected ? 'rgba(201,169,97,.14)' : 'transparent',
                        border: 'none', borderBottom: '1px solid var(--pf-line-soft)',
                        color: selected ? 'var(--pf-accent)' : 'var(--pf-text)', fontSize: 14,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{c.full_name}</span>
                      <span className="muted" style={{ fontSize: 12, flexShrink: 0 }}>
                        còn {c.remaining_sessions ?? '—'} buổi
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="eyebrow eyebrow-muted" style={{ marginBottom: 6 }}>Lặp lại cùng giờ hằng tuần</div>
              <div className="seg-tabs">
                {REPEAT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`seg-tab${draft.repeat === n ? ' active' : ''}`}
                    onClick={() => setDraft((d) => ({ ...d, repeat: n }))}
                  >
                    {n === 1 ? 'Chỉ buổi này' : `${n} tuần`}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              disabled={!draft.clientId || saving || !!draftClash.exact}
              onClick={saveDraft}
            >
              {saving ? 'Đang lưu…' : draft.repeat > 1 ? `Lưu ${draft.repeat} buổi` : 'Lưu lịch'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!picked} onClose={() => setPicked(null)} title={picked?.client_name ?? 'Lịch tập'}>
        {picked && (
          <div className="stack">
            <div>
              <div className="kv"><span className="kv-label">Thời gian</span><span className="kv-value">{dayLabel(picked.date)} · {picked.time}</span></div>
              <div className="kv"><span className="kv-label">HLV</span><span className="kv-value">{picked.coach_id}</span></div>
              <div className="kv">
                <span className="kv-label">Trạng thái</span>
                <span className="kv-value" style={{ color: STATUS_COLOR[picked.status] }}>{STATUS_LABEL[picked.status] ?? picked.status}</span>
              </div>
            </div>
            {(picked.status === 'pending' || picked.status === 'confirmed') && (
              <button className="btn btn-danger btn-block" onClick={cancelPicked}>Huỷ lịch này</button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

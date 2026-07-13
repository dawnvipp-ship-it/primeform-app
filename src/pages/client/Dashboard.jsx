import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getAssessment } from '../../data/assessments'
import { listPrograms, listPhases, listCompletions } from '../../data/programs'
import { listMyBookings } from '../../data/bookings'
import { HABITS, getRecentHabitLogs, toggleHabit, computeStreak } from '../../data/habits'
import { Eyebrow, Card, showToast } from '../../components/ui/primitives'
import { IconChevron, IconClipboard, IconDroplet, IconMoon, IconDumbbell, IconLeaf, IconCheck } from '../../components/ui/Icons'
import SessionRing from '../../components/ui/SessionRing'
import NotificationPrompt from '../../components/notify/NotificationPrompt'
import { localISODate } from '../../lib/date'
import logo from '../../assets/logo.png'
import lounge from '../../assets/studio-lounge.jpg'

const HABIT_ICONS = { water: IconDroplet, sleep: IconMoon, move: IconDumbbell, diet: IconLeaf }
const todayStr = () => localISODate()

const BOOKING_STATUS_LABEL = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận' }
const BOOKING_STATUS_COLOR = { pending: 'var(--pf-accent)', confirmed: 'var(--pf-ok)' }
const LOW_SESSIONS_THRESHOLD = 2

function DashboardSkeleton() {
  return (
    <div className="screen stack-lg" style={{ paddingTop: 0 }}>
      <div style={{ margin: '0 calc(var(--s4) * -1)', height: 150 }} className="skeleton" />
      <div className="skeleton" style={{ height: 30, width: '55%' }} />
      <Card style={{ display: 'flex', justifyContent: 'center', padding: '32px 24px' }}>
        <div className="skeleton" style={{ width: 180, height: 180, borderRadius: '50%' }} />
      </Card>
      <Card style={{ height: 148 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="stack" style={{ gap: 8 }}>
            <div className="skeleton" style={{ height: 10, width: '50%' }} />
            <div className="skeleton" style={{ height: 18, width: '75%' }} />
          </Card>
        ))}
      </div>
      <Card style={{ height: 78 }} />
    </div>
  )
}

function addDays(iso, n) {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function Dashboard() {
  const { db, client, logout } = useAuth()
  const navigate = useNavigate()

  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    if (!me) return null
    const [assessment, programs, phaseRows, completions, bookings, habitLogs] = await Promise.all([
      getAssessment(db, me.id),
      listPrograms(db, me.id),
      listPhases(db, me.id),
      listCompletions(db, me.id),
      listMyBookings(db),
      getRecentHabitLogs(db, me.id),
    ])
    return { me, assessment, programs, phaseRows, completions, bookings, habitLogs }
  }, [db])

  // Local, optimistically-updated copy - habit taps shouldn't wait on a
  // full dashboard refetch to show the checked state.
  const [habitLogs, setHabitLogs] = useState([])
  useEffect(() => { if (data?.habitLogs) setHabitLogs(data.habitLogs) }, [data])

  if (loading) return <DashboardSkeleton />
  if (!data?.me) return <div className="screen"><div className="empty">Không tìm thấy hồ sơ.</div></div>

  const { me, assessment, programs, phaseRows, completions, bookings } = data

  async function onToggleHabit(key, currentlyDone) {
    const next = !currentlyDone
    setHabitLogs((prev) => [
      ...prev.filter((l) => !(l.habit_key === key && l.log_date === todayStr())),
      { habit_key: key, log_date: todayStr(), done: next },
    ])
    try { await toggleHabit(db, me.id, key, next) }
    catch (e) { showToast(e.message || 'Không lưu được, thử lại.') }
  }

  // Nearest upcoming booked appointment (separate system from the program's
  // day rotation below - a client can have a scheduled time with their coach
  // that has nothing to do with which workout day is "next" in the plan).
  const today = localISODate()
  const nextBooking = (bookings || [])
    .filter((b) => (b.status === 'pending' || b.status === 'confirmed') && b.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0] || null

  // Current phase: prefer the phase_rows order (dated phases), falling back
  // to whatever order phases were first encountered across program days.
  const seenPhases = []
  programs.forEach((p) => { if (p.phase && !seenPhases.includes(p.phase)) seenPhases.push(p.phase) })
  const currentPhase = [
    ...phaseRows.map((r) => r.name).filter((n) => seenPhases.includes(n)),
    ...seenPhases.filter((n) => !phaseRows.some((r) => r.name === n)),
  ][0] || null

  const phaseDays = programs
    .filter((p) => (p.phase || null) === currentPhase)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const phaseRow = currentPhase ? phaseRows.find((r) => r.name === currentPhase) : null

  let progressLabel = '—'
  if (phaseRow?.start_date) {
    const daysElapsed = Math.floor((Date.now() - new Date(phaseRow.start_date).getTime()) / 86400000)
    const weekNum = Math.max(1, Math.floor(daysElapsed / 7) + 1)
    progressLabel = phaseRow.weeks ? `Tuần ${Math.min(weekNum, phaseRow.weeks)}/${phaseRow.weeks}` : `Tuần ${weekNum}`
  }

  // "Buổi kế tiếp" only rotates through days the coach flagged as counting
  // (counts_for_next !== false) - a cardio/stretch day can still be marked
  // done on its own, it just doesn't advance this pointer.
  const countableDays = phaseDays.filter((d) => d.counts_for_next !== false)
  let nextDay = countableDays[0] || null
  if (countableDays.length > 0) {
    const ids = new Set(countableDays.map((d) => d.id))
    const lastCompletion = completions.find((c) => ids.has(c.program_id))
    if (lastCompletion) {
      const idx = countableDays.findIndex((d) => d.id === lastCompletion.program_id)
      nextDay = countableDays[(idx + 1) % countableDays.length]
    }
  }
  const nextLabel = nextDay?.workout_day || 'Chưa có giáo án'

  const phaseEnd = phaseRow?.start_date && phaseRow?.weeks ? addDays(phaseRow.start_date, phaseRow.weeks * 7) : null
  const phaseRange = phaseRow?.start_date ? `${formatDate(phaseRow.start_date)}${phaseEnd ? ` → ${formatDate(phaseEnd)}` : ''}` : null

  return (
    <div className="screen stack-lg fade-in" style={{ paddingTop: 0 }}>
      {/* Studio banner */}
      <div style={{ position: 'relative', margin: '0 calc(var(--s4) * -1)', height: 150, overflow: 'hidden' }}>
        <img src={lounge} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,.45), #0A0A0A)' }} />
        <div className="row" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 var(--s4) var(--s4)', gap: 10 }}>
          <img src={logo} alt="" style={{ width: 30, height: 'auto' }} />
          <span className="eyebrow">Private Studio</span>
        </div>
      </div>

      <div>
        <h1 className="pf-display" style={{ fontSize: 30 }}>
          Chào, {client?.full_name?.split(' ').slice(-1)[0] || me.full_name}
        </h1>
      </div>

      <NotificationPrompt ownerType="client" clientId={me.id} />

      <Card style={{ display: 'flex', justifyContent: 'center', padding: '32px 24px' }}>
        <SessionRing total={me.total_sessions} used={me.used_sessions} />
      </Card>

      <Card className="stack" style={{ gap: 4 }}>
        <Eyebrow muted>Thói quen hôm nay</Eyebrow>
        {HABITS.map((h) => {
          const Icon = HABIT_ICONS[h.key]
          const done = habitLogs.some((l) => l.habit_key === h.key && l.log_date === todayStr() && l.done)
          const streak = computeStreak(habitLogs, h.key)
          return (
            <button
              key={h.key}
              onClick={() => onToggleHabit(h.key, done)}
              className="row-between"
              style={{ background: 'none', border: 'none', padding: '8px 0', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div className="row" style={{ gap: 10 }}>
                <Icon width={18} height={18} style={{ color: done ? 'var(--pf-accent)' : 'var(--pf-muted)' }} />
                <span style={{ fontWeight: 600, color: done ? 'var(--pf-text)' : 'var(--pf-muted)' }}>{h.label}</span>
              </div>
              <div className="row" style={{ gap: 10 }}>
                {streak > 1 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pf-accent)' }}>{streak} ngày</span>}
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                  border: `1px solid ${done ? 'var(--pf-accent)' : 'var(--pf-line)'}`,
                  background: done ? 'var(--pf-accent)' : 'transparent',
                }}>
                  {done && <IconCheck width={13} height={13} style={{ color: 'var(--pf-obsidian)' }} />}
                </span>
              </div>
            </button>
          )
        })}
      </Card>

      {me.remaining_sessions <= LOW_SESSIONS_THRESHOLD && (
        <Card style={{ borderColor: 'var(--pf-danger)' }}>
          <div style={{ fontSize: 13.5, color: 'var(--pf-danger)', lineHeight: 1.5 }}>
            {me.remaining_sessions <= 0
              ? 'Bạn đã dùng hết buổi tập. Liên hệ HLV để gia hạn gói.'
              : `Sắp hết gói tập — chỉ còn ${me.remaining_sessions} buổi. Liên hệ HLV để gia hạn.`}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: 12 }}>
        <Card><Eyebrow muted>Mục tiêu</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{assessment?.goal || '—'}</div></Card>
        <Card>
          <Eyebrow muted>Giai đoạn</Eyebrow>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{currentPhase || '—'}</div>
          {phaseRange && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--pf-muted)' }}>{phaseRange}</div>}
        </Card>
        <Card><Eyebrow muted>Tiến trình</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{progressLabel}</div></Card>
        <Card><Eyebrow muted>Buổi còn lại</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{me.remaining_sessions}</div></Card>
      </div>

      {nextBooking && (
        <Card className="row-between" onClick={() => navigate('/app/sessions')} style={{ cursor: 'pointer' }}>
          <div>
            <Eyebrow muted>Lịch hẹn gần nhất</Eyebrow>
            <div className="pf-display" style={{ fontSize: 22, marginTop: 6 }}>
              {formatDate(nextBooking.date)} · {nextBooking.time}
            </div>
            <span
              className="tag"
              style={{ marginTop: 6, display: 'inline-block', color: BOOKING_STATUS_COLOR[nextBooking.status], borderColor: BOOKING_STATUS_COLOR[nextBooking.status] }}
            >
              {BOOKING_STATUS_LABEL[nextBooking.status]}
            </span>
          </div>
          <span style={{ color: 'var(--pf-accent)' }}><IconChevron /></span>
        </Card>
      )}

      <Card
        className="row-between"
        onClick={() => navigate('/app/program', { state: { phase: currentPhase, dayId: nextDay?.id } })}
        style={{ cursor: 'pointer' }}
      >
        <div>
          <Eyebrow muted>Buổi kế tiếp</Eyebrow>
          <div className="pf-display" style={{ fontSize: 22, marginTop: 6 }}>{nextLabel}</div>
        </div>
        <span style={{ color: 'var(--pf-accent)' }}><IconChevron /></span>
      </Card>

      <Card className="row-between" onClick={() => navigate('/app/assessment')} style={{ cursor: 'pointer' }}>
        <div className="row" style={{ gap: 10 }}>
          <IconClipboard width={18} height={18} style={{ color: 'var(--pf-muted)' }} />
          <span style={{ fontWeight: 600 }}>Đánh giá ban đầu</span>
        </div>
        <span className="faint"><IconChevron /></span>
      </Card>
    </div>
  )
}

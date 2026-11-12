import { useState } from 'react'
import { Card, Eyebrow } from './primitives'
import { IconChevron, IconBack } from './Icons'
import {
  JOURNEY_METRICS, monthsToShow, monthLabel, monthChange, habitMonth, formatDelta, fmt, sessionsInMonth, shiftMonth,
} from '../../lib/journey'
import { HABITS } from '../../data/habits'

// Calendar-month view: how each body metric moved that month, and how steady the
// daily habits were. Month list is capped to the window of habit logs the page
// fetched (6 months).
export default function MonthlyProgress({ assessment, logs, habitLogs, monthlySessions }) {
  const months = monthsToShow()               // newest first
  const [idx, setIdx] = useState(0)
  const key = months[idx]

  const changes = JOURNEY_METRICS
    .map((m) => ({ m, c: monthChange(m, assessment, logs, key) }))
    .filter((x) => x.c)

  const sessionsNow = sessionsInMonth(monthlySessions, key)
  const sessionsPrev = sessionsInMonth(monthlySessions, shiftMonth(key, -1))

  const habitRows = HABITS.map((h) => ({ h, s: habitMonth(habitLogs, h.key, key) }))
  const anyHabit = habitRows.some((r) => r.s.done > 0)

  return (
    <Card className="stack">
      <div className="month-nav">
        <button className="month-btn" aria-label="Tháng trước" disabled={idx >= months.length - 1} onClick={() => setIdx(idx + 1)}>
          <IconBack width={16} height={16} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <Eyebrow>Theo tháng</Eyebrow>
          <div className="pf-display" style={{ fontSize: 20, marginTop: 4 }}>{monthLabel(key)}</div>
        </div>
        <button className="month-btn" aria-label="Tháng sau" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          <IconChevron width={16} height={16} />
        </button>
      </div>

      <hr className="divider" style={{ marginTop: 'var(--s5)' }} />

      {sessionsNow !== null && (
        <>
          <div className="row-between" style={{ marginTop: 'var(--s5)' }}>
            <div>
              <Eyebrow muted>Buổi tập trong tháng</Eyebrow>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
                {sessionsPrev !== null ? `Tháng trước: ${sessionsPrev} buổi · ` : ''}theo sổ của studio
              </div>
            </div>
            <div className="journey-num now">{sessionsNow}<small>buổi</small></div>
          </div>
          <hr className="divider" style={{ marginTop: 'var(--s5)' }} />
        </>
      )}

      <div className="stack" style={{ gap: 12 }}>
        <Eyebrow muted>Số đo trong tháng</Eyebrow>
        {changes.length === 0 ? (
          <div className="faint" style={{ fontSize: 13 }}>Tháng này chưa có buổi đo nào.</div>
        ) : changes.map(({ m, c }) => {
          const chip = formatDelta(c.delta, m.unit)
          return (
            <div key={m.key} className="row-between">
              <div>
                <div style={{ fontWeight: 600 }}>{m.label}</div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                  {c.start !== null ? `${fmt(c.start)} (${c.startLabel}) → ${fmt(c.end)} ${m.unit}` : `${fmt(c.end)} ${m.unit} · chưa có mốc để so`}
                </div>
              </div>
              {chip && <span className="tag">{chip}</span>}
            </div>
          )
        })}
      </div>

      <hr className="divider" style={{ marginTop: 'var(--s5)' }} />

      <div className="stack" style={{ gap: 14 }}>
        <Eyebrow muted>Thói quen trong tháng</Eyebrow>
        {!anyHabit ? (
          <div className="faint" style={{ fontSize: 13 }}>Chưa ghi thói quen nào trong tháng này.</div>
        ) : habitRows.map(({ h, s }) => (
          <div key={h.key} className="stack" style={{ gap: 6 }}>
            <div className="row-between">
              <span style={{ fontWeight: 600 }}>{h.label}</span>
              <span className="muted" style={{ fontSize: 13 }}>{s.done}/{s.scope} ngày · {s.pct}%</span>
            </div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  )
}

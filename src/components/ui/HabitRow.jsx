import { IconCheck } from './Icons'
import { computeStreak } from '../../data/habits'
import { lastSevenDays, fmt } from '../../lib/journey'
import { localISODate } from '../../lib/date'

// One habit on the dashboard. Yes/no habits toggle; numeric ones (sleep, water)
// show "6.5 / 7 giờ" with -/+ steps and count as done once the target is reached.
export default function HabitRow({ habit, Icon, logs, targets, onToggle, onSetValue }) {
  const todayStr = localISODate()
  const row = logs.find((l) => l.habit_key === habit.key && l.log_date === todayStr)
  const done = !!row?.done
  const num = habit.numeric
  const target = num ? targets[num.target] : null
  // A plain tick made before amounts existed has no value: read it as "target reached".
  const value = num ? (row?.value != null ? Number(row.value) : done ? target : 0) : null
  const streak = computeStreak(logs, habit.key)

  const set = (next) => onSetValue(habit.key, Math.min(num.max, Math.max(0, Math.round(next * 100) / 100)))
  const iconColor = done ? 'var(--pf-accent)' : 'var(--pf-muted)'

  return (
    <div style={{ padding: '10px 0' }}>
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <Icon width={18} height={18} style={{ color: iconColor, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: done ? 'var(--pf-text)' : 'var(--pf-muted)' }}>{habit.label}</div>
            <div className="row" style={{ gap: 10, marginTop: 5 }}>
              <div className="week-dots" aria-label="7 ngày gần nhất">
                {lastSevenDays(logs, habit.key).map((d) => (
                  <span key={d.date} className={`week-dot${d.done ? ' on' : ''}${d.isToday ? ' today' : ''}`} />
                ))}
              </div>
              {streak > 1 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--pf-accent)' }}>{streak} ngày</span>}
            </div>
          </div>
        </div>

        <button
          onClick={() => (num ? set(done ? 0 : target) : onToggle(habit.key, done))}
          aria-label={done ? 'Bỏ đánh dấu' : 'Đánh dấu hoàn thành'}
          style={{
            width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer',
            border: `1px solid ${done ? 'var(--pf-accent)' : 'var(--pf-line)'}`,
            background: done ? 'var(--pf-accent)' : 'transparent',
          }}
        >
          {done && <IconCheck width={14} height={14} style={{ color: 'var(--pf-obsidian)' }} />}
        </button>
      </div>

      {num && (
        <div className="row" style={{ gap: 12, marginTop: 10, paddingLeft: 28 }}>
          <button className="month-btn" aria-label="Giảm" disabled={value <= 0} onClick={() => set(value - num.step)} style={{ fontSize: 18 }}>−</button>
          <div style={{ minWidth: 96, textAlign: 'center' }}>
            <span className="pf-display" style={{ fontSize: 20, color: done ? 'var(--pf-gold-bright)' : 'var(--pf-text)' }}>{fmt(value)}</span>
            <span className="muted" style={{ fontSize: 13 }}> / {fmt(target)} {num.unit}</span>
          </div>
          <button className="month-btn" aria-label="Tăng" disabled={value >= num.max} onClick={() => set(value + num.step)} style={{ fontSize: 18 }}>+</button>
        </div>
      )}
    </div>
  )
}

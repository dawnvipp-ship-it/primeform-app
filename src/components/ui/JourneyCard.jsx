import { Card, Eyebrow } from './primitives'
import { JOURNEY_METRICS, journeyFor, formatDelta, fmt, daysUntil } from '../../lib/journey'

function fullDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function JourneyRow({ j }) {
  const { metric, baseline, current, target, delta, progress, reached, single } = j
  const cols = single ? '1fr' : target !== null ? '1fr 1.3fr 1fr' : '1fr 1.3fr'
  const toward = target !== null && delta !== null && ((target < baseline.value && delta < 0) || (target > baseline.value && delta > 0))
  const chip = formatDelta(delta, metric.unit)
  const baselineCap = baseline.from === 'assessment' ? 'Ban đầu' : 'Lần đo đầu'

  return (
    <div className="journey-metric stack" style={{ gap: 14 }}>
      <div className="row-between">
        <Eyebrow muted>{metric.label}</Eyebrow>
        {chip && (
          <span className="tag" style={toward || reached ? { color: 'var(--pf-ok)', borderColor: 'var(--pf-ok)' } : undefined}>{chip}</span>
        )}
      </div>

      <div className="journey-cols" style={{ gridTemplateColumns: cols }}>
        {!single && (
          <div>
            <div className="journey-num">{fmt(baseline.value)}<small>{metric.unit}</small></div>
            <div className="journey-cap">{baselineCap}</div>
          </div>
        )}
        <div>
          <div className="journey-num now">{fmt(current.value)}<small>{metric.unit}</small></div>
          <div className="journey-cap">Hiện tại</div>
        </div>
        {!single && target !== null && (
          <div>
            <div className="journey-num">{fmt(target)}<small>{metric.unit}</small></div>
            <div className="journey-cap">Mục tiêu</div>
          </div>
        )}
      </div>

      {progress !== null && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="bar-track">
            <div className={reached ? 'bar-fill done' : 'bar-fill'} style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div style={{ fontSize: 12.5, color: reached ? 'var(--pf-ok)' : 'var(--pf-muted)' }}>
            {reached
              ? 'Bạn đã đạt mục tiêu này'
              : progress === 0
                ? 'Chưa có thay đổi hướng tới mục tiêu'
                : `Đã đi ${Math.round(progress * 100)}% đường tới mục tiêu`}
          </div>
        </div>
      )}

      {single && <div className="faint" style={{ fontSize: 12.5 }}>Cần thêm một lần đo nữa để thấy thay đổi.</div>}
      {!single && metric.targetKey && target === null && (
        <div className="faint" style={{ fontSize: 12.5 }}>Chưa đặt mục tiêu. HLV sẽ đặt cùng bạn.</div>
      )}
    </div>
  )
}

// "Hành trình của bạn": per metric, the starting point (initial assessment value,
// else the first coach measurement), where the client is now, and the target.
export default function JourneyCard({ assessment, logs, targetDate }) {
  const rows = JOURNEY_METRICS.map((m) => journeyFor(m, assessment, logs)).filter((j) => j.baseline && j.current)
  if (rows.length === 0) return null
  return (
    <Card className="journey stack-lg">
      <div>
        <Eyebrow>Hành trình của bạn</Eyebrow>
        <div className="faint" style={{ fontSize: 12.5, marginTop: 6 }}>
          Từ số đo ban đầu đến hôm nay
          {targetDate && daysUntil(targetDate) !== null && (
            daysUntil(targetDate) >= 0
              ? ` · còn ${daysUntil(targetDate)} ngày đến mốc ${fullDate(targetDate)}`
              : ` · mốc ${fullDate(targetDate)} đã qua`
          )}
        </div>
      </div>
      {rows.map((j) => <JourneyRow key={j.metric.key} j={j} />)}
      <div className="faint" style={{ fontSize: 12 }}>
        Lần đo gần nhất: {fullDate(rows.map((j) => j.current.date).sort().pop())}
      </div>
    </Card>
  )
}

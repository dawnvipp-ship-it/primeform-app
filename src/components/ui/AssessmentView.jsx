import { Card, Eyebrow, Empty } from './primitives'
import { targetsFrom, daysUntil, fmt } from '../../lib/journey'

const pos = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null }
const text = (v) => (typeof v === 'string' ? v.trim() : v)
const dmy = (iso) => (iso ? iso.split('-').reverse().join('/') : '')

// "58 → 63 kg": where the client started and where the coach set the target.
function Tile({ label, from, to, unit }) {
  return (
    <div className="goal-tile">
      <div className="fact-label">{label}</div>
      <div className="journey-num" style={{ marginTop: 8 }}>
        {from !== null && (
          <>
            {fmt(from)}
            <span style={{ color: 'var(--pf-muted)', fontSize: 16, margin: '0 6px' }}>→</span>
          </>
        )}
        <span style={{ color: 'var(--pf-gold-bright)' }}>{fmt(to)}</span>
        <small>{unit}</small>
      </div>
      {from === null && <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>mục tiêu</div>}
    </div>
  )
}

function Daily({ label, value, unit }) {
  return (
    <div className="goal-tile">
      <div className="fact-label">{label}</div>
      <div className="journey-num" style={{ marginTop: 8, color: 'var(--pf-gold-bright)' }}>{value}<small>{unit}</small></div>
    </div>
  )
}

function Fact({ label, value, wide }) {
  return (
    <div className={wide ? 'wide' : ''}>
      <div className="fact-label">{label}</div>
      <div className="fact-value" style={{ whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  )
}

// What the coach recorded at the first assessment, laid out for the client.
// coach_notes is shown on purpose: the coach form labels it "khách cũng thấy".
export default function AssessmentView({ a }) {
  if (!a) return <Empty title="Chưa có đánh giá" hint="HLV sẽ cập nhật sau buổi Body Diagnostic." />

  const targets = targetsFrom(a)
  const days = daysUntil(targets.date)
  const tiles = [
    { label: 'Cân nặng', from: pos(a.weight), to: pos(a.target_weight), unit: 'kg' },
    { label: 'Body fat', from: pos(a.body_fat), to: pos(a.target_body_fat), unit: '%' },
    { label: 'Vòng eo', from: null, to: pos(a.target_waist), unit: 'cm' },
  ].filter((t) => t.to !== null)

  const body = [
    ['Chấn thương', a.injuries], ['Tư thế', a.posture_notes], ['Vận động', a.mobility_notes], ['Lối sống', a.lifestyle_notes],
  ].filter(([, v]) => text(v))

  const facts = [
    ['Chiều cao', pos(a.height) ? `${fmt(a.height)} cm` : null],
    ['Cân nặng ban đầu', pos(a.weight) ? `${fmt(a.weight)} kg` : null],
    ['Body fat ban đầu', pos(a.body_fat) ? `${fmt(a.body_fat)}%` : null],
    ['Nghề nghiệp', text(a.occupation)],
    ['Kinh nghiệm tập luyện', text(a.training_experience)],
    ['Đã từng tập với PT', text(a.prior_pt_experience)],
    ['Lịch rảnh trong tuần', text(a.weekly_availability)],
    ['Thiết bị tập', text(a.equipment)],
    ['Số bữa mỗi ngày', pos(a.meals_per_day) ? String(a.meals_per_day) : null],
    ['Thói quen ăn uống', text(a.eating_habits)],
    ['Dị ứng / kiêng ăn', text(a.allergies)],
    ['App theo dõi', text(a.tracking_app)],
  ].filter(([, v]) => v)

  return (
    <div className="stack-lg">
      {/* Goal */}
      <Card className="journey stack">
        <Eyebrow>Mục tiêu của bạn</Eyebrow>
        <div className="pf-display" style={{ fontSize: 26, lineHeight: 1.2 }}>{text(a.goal) || '—'}</div>
        {text(a.specific_goal) && (
          <div className="muted" style={{ lineHeight: 1.55, borderLeft: '2px solid var(--pf-accent-dim)', paddingLeft: 12 }}>{text(a.specific_goal)}</div>
        )}
        {targets.date && days !== null && (
          <div className="row" style={{ gap: 8 }}>
            <span className="tag tag-accent">Mốc {dmy(targets.date)}</span>
            <span className="faint" style={{ fontSize: 12.5 }}>{days >= 0 ? `còn ${days} ngày` : 'đã qua mốc này'}</span>
          </div>
        )}
        {tiles.length > 0 && (
          <div className="goal-tiles">
            {tiles.map((t) => <Tile key={t.label} {...t} />)}
          </div>
        )}
      </Card>

      {/* Daily targets (coach-set, with studio defaults) */}
      <div className="stack" style={{ gap: 12 }}>
        <Eyebrow muted>Mục tiêu mỗi ngày</Eyebrow>
        <div className="goal-tiles" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Daily label="Ngủ" value={`≥ ${fmt(targets.sleepHours)}`} unit="giờ" />
          <Daily label="Nước" value={fmt(targets.waterLiters)} unit="lít" />
          <Daily label="Tập" value={String(targets.sessionsPerWeek)} unit="buổi/tuần" />
        </div>
      </div>

      {/* Body & movement */}
      {body.length > 0 && (
        <Card>
          <Eyebrow muted>Thể trạng và vận động</Eyebrow>
          <div style={{ marginTop: 14 }}>
            {body.map(([label, v]) => (
              <div key={label} className="note-block">
                <div className="fact-label">{label}</div>
                <p style={{ marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{text(v)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* About you */}
      {facts.length > 0 && (
        <Card>
          <Eyebrow muted>Thông tin của bạn</Eyebrow>
          <div className="fact-grid" style={{ marginTop: 16 }}>
            {facts.map(([label, v]) => <Fact key={label} label={label} value={v} wide={String(v).length > 22} />)}
          </div>
        </Card>
      )}

      {/* Coach */}
      {text(a.coach_notes) && (
        <Card className="stack" style={{ gap: 10, borderLeft: '2px solid var(--pf-accent)' }}>
          <Eyebrow>Lời nhắn từ HLV</Eyebrow>
          <p style={{ lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{text(a.coach_notes)}</p>
        </Card>
      )}

      <p className="faint" style={{ fontSize: 12, lineHeight: 1.6 }}>
        Đây là những gì chúng tôi ghi nhận ở buổi Body Diagnostic. Nếu có điều gì chưa đúng hoặc đã thay đổi, hãy nói với HLV để cập nhật.
      </p>
    </div>
  )
}

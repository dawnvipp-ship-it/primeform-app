import { Link, useLocation } from 'react-router-dom'
import { Card, Eyebrow } from './primitives'
import { IconChevron } from './Icons'
import { markTapped } from '../../lib/guideMemory'
import { wordCount, readMinutes } from '../../lib/guideRules'

// The client area lives at /app, the coach's "xem như học viên" preview at /coach/preview.
export function useGuideBase() {
  const { pathname } = useLocation()
  return pathname.startsWith('/coach/preview') ? '/coach/preview' : '/app'
}

export const minutesFor = (card) => readMinutes(wordCount(card.body))

// Always-there entry on Tổng quan (only rendered when at least one card is approved).
export function GuideEntry({ base }) {
  return (
    <Link to={`${base}/guide`} style={{ display: 'block' }}>
      <Card className="stack" style={{ gap: 8 }}>
        <Eyebrow>Cẩm nang Prime Form</Eyebrow>
        <div className="pf-display" style={{ fontSize: 20, lineHeight: 1.25 }}>Hiểu cơ thể. Kiên nhẫn với quá trình.</div>
        <div className="row-between">
          <span className="muted" style={{ fontSize: 13 }}>Những điều nhỏ giúp bạn duy trì hành trình tập.</span>
          <span className="row" style={{ gap: 4, color: 'var(--pf-accent)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            Khám phá <IconChevron width={14} height={14} />
          </span>
        </div>
      </Card>
    </Link>
  )
}

// At most one, only when a rule fires (see lib/guideRules.js).
export function GuideSuggestion({ suggestion, clientId, base }) {
  const { ruleId, card } = suggestion
  return (
    <Link to={`${base}/guide/${card.id}`} onClick={() => markTapped(clientId, ruleId)} style={{ display: 'block' }}>
      <Card className="stack" style={{ gap: 8, borderLeft: '2px solid var(--pf-accent)' }}>
        <Eyebrow muted>Một điều bạn nên biết</Eyebrow>
        <div className="pf-display" style={{ fontSize: 20, lineHeight: 1.25 }}>{card.title}</div>
        <div className="muted" style={{ fontSize: 13 }}>{card.summary}</div>
        <span className="row" style={{ gap: 4, color: 'var(--pf-accent)', fontSize: 13, fontWeight: 600 }}>
          Đọc trong {minutesFor(card)} phút <IconChevron width={14} height={14} />
        </span>
      </Card>
    </Link>
  )
}

import { Link } from 'react-router-dom'
import { Eyebrow, Card, Empty } from '../../components/ui/primitives'
import { IconBack, IconChevron } from '../../components/ui/Icons'
import { GUIDE_GROUPS, GUIDE_CARDS } from '../../data/guide'
import { useGuideBase, minutesFor } from '../../components/ui/GuideCards'

// Library: approved cards only, grouped in a fixed order. No search, counters or ratings.
export default function Guide() {
  const base = useGuideBase()
  const approved = GUIDE_CARDS.filter((c) => c.approved && c.body.length > 0)
  const groups = GUIDE_GROUPS.map((g) => ({ ...g, cards: approved.filter((c) => c.group === g.key) })).filter((g) => g.cards.length > 0)

  return (
    <div className="screen stack-lg fade-in">
      <div className="stack" style={{ gap: 10 }}>
        <Link to={base} className="row muted" style={{ gap: 6, fontSize: 13 }}><IconBack width={14} height={14} /> Tổng quan</Link>
        <Eyebrow>Cẩm nang Prime Form</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Training is refinement.</h1>
      </div>

      {groups.length === 0 ? (
        <Empty title="Chưa có nội dung" />
      ) : groups.map((g) => (
        <div key={g.key} className="stack" style={{ gap: 12 }}>
          <Eyebrow muted>{g.label}</Eyebrow>
          {g.cards.map((c) => (
            <Link key={c.id} to={`${base}/guide/${c.id}`} style={{ display: 'block' }}>
              <Card className="row-between" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.title}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{c.summary}</div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>{minutesFor(c)} phút đọc</div>
                </div>
                <IconChevron width={16} height={16} style={{ color: 'var(--pf-muted)', flexShrink: 0 }} />
              </Card>
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}

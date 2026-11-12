import { Link, useParams } from 'react-router-dom'
import { Eyebrow, Card, Empty } from '../../components/ui/primitives'
import { IconBack } from '../../components/ui/Icons'
import { GUIDE_GROUPS, GUIDE_CARDS, GUIDE_SAFETY } from '../../data/guide'
import { useGuideBase, minutesFor } from '../../components/ui/GuideCards'

// One card. An id that does not exist, or is not approved yet, looks the same as
// any unknown page - drafts are never reachable by URL.
export default function GuideArticle() {
  const { id } = useParams()
  const base = useGuideBase()
  const card = GUIDE_CARDS.find((c) => c.id === id && c.approved && c.body.length > 0)
  const back = (
    <Link to={`${base}/guide`} className="row muted" style={{ gap: 6, fontSize: 13 }}><IconBack width={14} height={14} /> Cẩm nang</Link>
  )

  if (!card) {
    return <div className="screen stack fade-in">{back}<Empty title="Không tìm thấy nội dung" /></div>
  }
  const group = GUIDE_GROUPS.find((g) => g.key === card.group)

  return (
    <div className="screen stack-lg fade-in">
      <div className="stack" style={{ gap: 12 }}>
        {back}
        {group && <Eyebrow>{group.label}</Eyebrow>}
        <h1 style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.15 }}>{card.title}</h1>
        <div className="faint" style={{ fontSize: 13 }}>{minutesFor(card)} phút đọc</div>
      </div>

      <hr className="divider" />

      <div className="stack" style={{ gap: 16, fontSize: 16, lineHeight: 1.65 }}>
        {card.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <Card className="stack" style={{ gap: 8, borderLeft: '2px solid var(--pf-accent)' }}>
        <Eyebrow>Việc nhỏ hôm nay</Eyebrow>
        <div style={{ lineHeight: 1.55 }}>{card.action}</div>
      </Card>

      <p className="faint" style={{ fontSize: 12, lineHeight: 1.6 }}>{GUIDE_SAFETY}</p>
    </div>
  )
}

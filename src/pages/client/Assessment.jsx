import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getAssessment } from '../../data/assessments'
import { SkeletonScreen, Eyebrow, Card, KV, Empty } from '../../components/ui/primitives'

function Note({ label, text }) {
  if (!text) return null
  return (
    <Card>
      <Eyebrow muted>{label}</Eyebrow>
      <p style={{ marginTop: 10, color: 'var(--pf-text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{text}</p>
    </Card>
  )
}

export default function Assessment() {
  const { db } = useAuth()
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const a = me ? await getAssessment(db, me.id) : null
    return { a }
  }, [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  const a = data?.a

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Hồ sơ</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Đánh giá ban đầu</h1>
      </div>

      {!a ? (
        <Empty title="Chưa có đánh giá" hint="HLV sẽ cập nhật sau buổi Body Diagnostic." />
      ) : (
        <>
          <Card>
            <Eyebrow muted>Chỉ số</Eyebrow>
            <div style={{ marginTop: 8 }}>
              <KV label="Mục tiêu" value={a.goal} />
              <KV label="Cân nặng" value={a.weight ? `${a.weight} kg` : null} />
              <KV label="Cân nặng mục tiêu" value={a.target_weight ? `${a.target_weight} kg` : null} />
              <KV label="Body fat" value={a.body_fat ? `${a.body_fat}%` : null} />
              <KV label="Body fat mục tiêu" value={a.target_body_fat ? `${a.target_body_fat}%` : null} />
            </div>
          </Card>
          <Note label="Chấn thương" text={a.injuries} />
          <Note label="Tư thế" text={a.posture_notes} />
          <Note label="Vận động" text={a.mobility_notes} />
          <Note label="Lối sống" text={a.lifestyle_notes} />
          <Note label="Ghi chú từ HLV" text={a.coach_notes} />
        </>
      )}
    </div>
  )
}

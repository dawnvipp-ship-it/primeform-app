import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getAssessment } from '../../data/assessments'
import { SkeletonScreen, Eyebrow } from '../../components/ui/primitives'
import AssessmentView from '../../components/ui/AssessmentView'

export default function Assessment() {
  const { db } = useAuth()
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const a = me ? await getAssessment(db, me.id) : null
    return { a }
  }, [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>

  return (
    <div className="screen stack-lg fade-in">
      <div>
        <Eyebrow>Hồ sơ</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Đánh giá ban đầu</h1>
      </div>
      <AssessmentView a={data?.a} />
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getClient } from '../../data/clients'
import { InlineLoader, Eyebrow, Empty } from '../../components/ui/primitives'
import { IconBack } from '../../components/ui/Icons'

import ProfileSection from './sections/ProfileSection'
import AssessmentSection from './sections/AssessmentSection'
import MealSection from './sections/MealSection'
import ProgramSection from './sections/ProgramSection'
import ProgressSection from './sections/ProgressSection'

const SECTIONS = [
  { key: 'profile', label: 'Hồ sơ & buổi tập' },
  { key: 'assessment', label: 'Đánh giá' },
  { key: 'meal', label: 'Dinh dưỡng' },
  { key: 'program', label: 'Giáo án' },
  { key: 'progress', label: 'Tiến độ' },
]

export default function ClientDetail() {
  const { id } = useParams()
  const { db } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState('profile')
  const { data: client, loading, reload } = useAsync(() => getClient(db, id), [db, id])

  if (loading) return <div className="coach-screen"><InlineLoader /></div>
  if (!client) return <div className="coach-screen"><Empty title="Không tìm thấy khách hàng." /></div>

  return (
    <div className="coach-screen stack">
      <button className="btn-quiet" onClick={() => navigate('/coach')} style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
        <IconBack width={16} height={16} /> Danh sách
      </button>

      <div className="row-between">
        <div>
          <Eyebrow>{client.client_code}</Eyebrow>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>{client.full_name}</h1>
        </div>
        <div className="tag tag-accent">còn {client.remaining_sessions}/{client.total_sessions}</div>
      </div>

      <div className="seg-tabs">
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => setSection(s.key)} className={`seg-tab seg-tab-accent${section === s.key ? ' active' : ''}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="fade-in" key={section}>
        {section === 'profile' && <ProfileSection client={client} onSaved={reload} />}
        {section === 'assessment' && <AssessmentSection clientId={client.id} />}
        {section === 'meal' && <MealSection clientId={client.id} />}
        {section === 'program' && <ProgramSection clientId={client.id} />}
        {section === 'progress' && <ProgressSection clientId={client.id} />}
      </div>
    </div>
  )
}

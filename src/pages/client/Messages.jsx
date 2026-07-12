import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { SkeletonScreen, Eyebrow, Empty } from '../../components/ui/primitives'
import ChatThread from '../../components/chat/ChatThread'

export default function Messages() {
  const { db } = useAuth()
  const { data: me, loading } = useAsync(() => getMyClient(db), [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  if (!me) return <div className="screen"><Empty title="Không tìm thấy hồ sơ." /></div>

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Trao đổi</Eyebrow>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Nhắn tin{me.coach ? ` với ${me.coach.split(' ').slice(-1)[0]}` : ''}</h1>
      </div>
      <ChatThread clientId={me.id} sender="client" />
    </div>
  )
}

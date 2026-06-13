import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { getAssessment } from '../../data/assessments'
import { listPrograms } from '../../data/programs'
import { InlineLoader, Eyebrow, Card } from '../../components/ui/primitives'
import { IconChevron, IconLogout } from '../../components/ui/Icons'
import SessionRing from '../../components/ui/SessionRing'
import logo from '../../assets/logo.png'
import lounge from '../../assets/studio-lounge.jpg'

export default function Dashboard() {
  const { db, client, logout } = useAuth()
  const navigate = useNavigate()

  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    if (!me) return null
    const [assessment, programs] = await Promise.all([
      getAssessment(db, me.id),
      listPrograms(db, me.id),
    ])
    return { me, assessment, programs }
  }, [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  if (!data?.me) return <div className="screen"><div className="empty">Không tìm thấy hồ sơ.</div></div>

  const { me, assessment, programs } = data
  const firstDay = programs.find((p) => !/khởi động|warm/i.test(p.workout_day || '')) || programs[0]
  const phase = firstDay?.phase || '—'
  const week = firstDay?.week ? `Tuần ${firstDay.week}` : '—'
  const nextWorkout = firstDay?.workout_day || 'Chưa có giáo án'

  return (
    <div className="screen stack-lg fade-in" style={{ paddingTop: 0 }}>
      {/* Studio banner */}
      <div style={{ position: 'relative', margin: '0 calc(var(--s4) * -1)', height: 150, overflow: 'hidden' }}>
        <img src={lounge} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,11,11,.45), #0B0B0B)' }} />
        <div className="row-between" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 var(--s4) var(--s4)' }}>
          <div className="row" style={{ gap: 10 }}>
            <img src={logo} alt="" style={{ width: 30, height: 'auto' }} />
            <span className="eyebrow">Private Studio</span>
          </div>
          <button className="btn-quiet" onClick={async () => { await logout(); navigate('/'); }} title="Đăng xuất"><IconLogout /></button>
        </div>
      </div>

      <div>
        <h1 className="pf-display" style={{ fontSize: 30 }}>
          Chào, {client?.full_name?.split(' ').slice(-1)[0] || me.full_name}
        </h1>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'center', padding: '32px 24px' }}>
        <SessionRing total={me.total_sessions} used={me.used_sessions} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card><Eyebrow muted>Mục tiêu</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{assessment?.goal || '—'}</div></Card>
        <Card><Eyebrow muted>Giai đoạn</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{phase}</div></Card>
        <Card><Eyebrow muted>Tiến trình</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{week}</div></Card>
        <Card><Eyebrow muted>Buổi còn lại</Eyebrow><div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{me.remaining_sessions}</div></Card>
      </div>

      <Card className="row-between" onClick={() => navigate('/app/program')} style={{ cursor: 'pointer' }}>
        <div>
          <Eyebrow muted>Buổi kế tiếp</Eyebrow>
          <div className="pf-display" style={{ fontSize: 22, marginTop: 6 }}>{nextWorkout}</div>
        </div>
        <span style={{ color: 'var(--pf-accent)' }}><IconChevron /></span>
      </Card>
    </div>
  )
}

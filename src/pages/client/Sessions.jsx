import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import SessionRing from '../../components/ui/SessionRing'

export default function Sessions() {
  const { db } = useAuth()
  const { data, loading } = useAsync(async () => ({ me: await getMyClient(db) }), [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  const me = data?.me
  if (!me) return <div className="screen"><Empty title="Không tìm thấy hồ sơ." /></div>

  const pct = me.total_sessions > 0 ? Math.round((me.used_sessions / me.total_sessions) * 100) : 0

  return (
    <div className="screen stack-lg fade-in">
      <div>
        <Eyebrow>Gói tập</Eyebrow>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Buổi tập</h1>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'center', padding: '36px 24px' }}>
        <SessionRing total={me.total_sessions} used={me.used_sessions} size={240} />
      </Card>

      <Card className="stack">
        <div className="row-between">
          <span className="kv-label">Đã hoàn thành</span>
          <span className="kv-value">{pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'var(--pf-line)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--pf-accent)', transition: 'width .8s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        <div style={{ marginTop: 6 }}>
          <div className="kv"><span className="kv-label">Trọn gói</span><span className="kv-value">{me.total_sessions} buổi</span></div>
          <div className="kv"><span className="kv-label">Đã tập</span><span className="kv-value">{me.used_sessions} buổi</span></div>
          <div className="kv"><span className="kv-label">Còn lại</span><span className="kv-value" style={{ color: 'var(--pf-accent)' }}>{me.remaining_sessions} buổi</span></div>
        </div>
      </Card>
    </div>
  )
}

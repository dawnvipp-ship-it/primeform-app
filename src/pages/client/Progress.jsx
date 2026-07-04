import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { listProgressLogs, listPhotos, signedPhotoUrl } from '../../data/progress'
import { listPrograms, listCompletions, computeMuscleHeat } from '../../data/programs'
import { MUSCLE_LABEL } from '../../data/muscleGroups'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import MuscleBodyMap from '../../components/ui/MuscleBodyMap'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const ACCENT = '#E8D8C3'

function Chart({ title, unit, dataKey, rows }) {
  const points = rows
    .filter((r) => r[dataKey] != null)
    .map((r) => ({ date: r.log_date?.slice(5), value: Number(r[dataKey]) }))
  if (points.length === 0) return null
  return (
    <Card>
      <Eyebrow muted>{title}</Eyebrow>
      <div style={{ height: 180, marginTop: 14 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: '#5A564F', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5A564F', fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#1A1917', border: '1px solid rgba(232,216,195,.12)', borderRadius: 8, color: '#F2EEE8' }}
              labelStyle={{ color: '#8C877E' }}
              formatter={(v) => [`${v}${unit}`, '']}
            />
            <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default function Progress() {
  const { db } = useAuth()
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    if (!me) return null
    const [logs, photos, programs, completions] = await Promise.all([
      listProgressLogs(db, me.id), listPhotos(db, me.id), listPrograms(db, me.id), listCompletions(db, me.id),
    ])
    const withUrls = await Promise.all(
      photos.map(async (p) => ({ ...p, url: await signedPhotoUrl(db, p.photo_path).catch(() => null) }))
    )
    return { logs, photos: withUrls, muscleHeat: computeMuscleHeat(programs, completions) }
  }, [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  if (!data) return <div className="screen"><Empty title="Không tìm thấy hồ sơ." /></div>

  const { logs, photos, muscleHeat } = data
  const hasLogs = logs.length > 0
  const hasMuscleData = Object.keys(muscleHeat).length > 0

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Theo dõi</Eyebrow>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Tiến độ</h1>
      </div>

      {hasMuscleData && (
        <Card className="stack">
          <Eyebrow muted>Nhóm cơ đã tập gần đây (30 ngày)</Eyebrow>
          <MuscleBodyMap heat={muscleHeat} labels={MUSCLE_LABEL} />
          <p className="faint" style={{ fontSize: 11.5, textAlign: 'center' }}>Màu càng đậm = tập càng nhiều</p>
        </Card>
      )}

      {!hasLogs && photos.length === 0 ? (
        <Empty title="Chưa có dữ liệu tiến độ" hint="Số liệu sẽ xuất hiện sau các buổi đo." />
      ) : (
        <>
          <Chart title="Cân nặng" unit=" kg" dataKey="weight" rows={logs} />
          <Chart title="Body fat" unit="%" dataKey="body_fat" rows={logs} />
          <Chart title="Vòng eo" unit=" cm" dataKey="waist" rows={logs} />
          <Chart title="Ngực" unit=" cm" dataKey="chest" rows={logs} />
          <Chart title="Mông" unit=" cm" dataKey="hip" rows={logs} />
          <Chart title="Bụng" unit=" cm" dataKey="belly" rows={logs} />
          <Chart title="Tay" unit=" cm" dataKey="arm" rows={logs} />

          {photos.length > 0 && (
            <div className="stack">
              <Eyebrow muted>Hình ảnh</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {photos.map((p) => (
                  <div key={p.id}>
                    <div style={{ aspectRatio: '3/4', borderRadius: 10, overflow: 'hidden', background: 'var(--pf-surface-2)', border: '1px solid var(--pf-line)' }}>
                      {p.url && <img src={p.url} alt={`Tuần ${p.week}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div className="eyebrow eyebrow-muted" style={{ marginTop: 6 }}>Tuần {p.week}{p.angle ? ` · ${p.angle}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

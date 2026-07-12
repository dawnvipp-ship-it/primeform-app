import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { listProgressLogs, listPhotos, signedPhotoUrl } from '../../data/progress'
import { listPrograms, listCompletions, computeMuscleHeat } from '../../data/programs'
import { SkeletonScreen, Eyebrow, Card, Empty, showToast } from '../../components/ui/primitives'
import { IconShare } from '../../components/ui/Icons'
import MuscleBodyMap from '../../components/ui/MuscleBodyMap'
import BeforeAfterSlider from '../../components/ui/BeforeAfterSlider'
import { buildProgressShareCard, shareOrDownload } from '../../lib/shareCard'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import logo from '../../assets/logo.png'

// Matches the live --pf-gold/--pf-surface-2/--pf-line/--pf-text tokens -
// Recharts renders these as SVG attributes outside the CSS cascade, so the
// values have to be duplicated here rather than referenced via var().
const ACCENT = '#C9A961'
const TICK_COLOR = '#8C877E'

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
            <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={40} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#242424', border: '1px solid rgba(245,241,234,.10)', borderRadius: 8, color: '#F5F1EA' }}
              labelStyle={{ color: TICK_COLOR }}
              formatter={(v) => [`${v}${unit}`, '']}
            />
            <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// Weight/body-fat change from first log to latest, formatted for the share
// card - only includes a line for a metric that's actually present on both ends.
function computeDeltaLines(logs) {
  if (logs.length < 2) return []
  const first = logs[0]
  const last = logs[logs.length - 1]
  const lines = []
  if (first.weight != null && last.weight != null) {
    const d = last.weight - first.weight
    lines.push(`${d > 0 ? '+' : ''}${d.toFixed(1)} KG`)
  }
  if (first.body_fat != null && last.body_fat != null) {
    const d = last.body_fat - first.body_fat
    lines.push(`${d > 0 ? '+' : ''}${d.toFixed(1)}% BODY FAT`)
  }
  return lines
}

export default function Progress() {
  const { db } = useAuth()
  const [sharing, setSharing] = useState(false)
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    if (!me) return null
    const [logs, photos, programs, completions] = await Promise.all([
      listProgressLogs(db, me.id), listPhotos(db, me.id), listPrograms(db, me.id), listCompletions(db, me.id),
    ])
    const withUrls = await Promise.all(
      photos.map(async (p) => ({ ...p, url: await signedPhotoUrl(db, p.photo_path).catch(() => null) }))
    )
    return { me, logs, photos: withUrls, muscleHeat: computeMuscleHeat(programs, completions) }
  }, [db])

  if (loading) return <div className="screen"><SkeletonScreen /></div>
  if (!data) return <div className="screen"><Empty title="Không tìm thấy hồ sơ." /></div>

  const { me, logs, photos, muscleHeat } = data
  const hasLogs = logs.length > 0
  const hasMuscleData = Object.keys(muscleHeat).length > 0

  // Earliest vs latest photo per angle - only meaningful once a given angle
  // has been shot at least twice (photos already arrive sorted by week asc).
  const photosByAngle = {}
  photos.forEach((p) => { (photosByAngle[p.angle || 'khác'] ??= []).push(p) })
  const comparisons = Object.entries(photosByAngle)
    .filter(([, list]) => list.length >= 2)
    .map(([angle, list]) => ({ angle, before: list[0], after: list[list.length - 1] }))

  const canShare = hasLogs || comparisons.length > 0

  async function handleShare() {
    setSharing(true)
    try {
      const deltaLines = computeDeltaLines(logs)
      let periodLabel = ''
      if (logs.length >= 2) {
        const days = Math.round((new Date(logs[logs.length - 1].log_date) - new Date(logs[0].log_date)) / 86400000)
        periodLabel = `Trong ${Math.max(1, Math.round(days / 7))} tuần`
      }
      const comparison = comparisons[0] || null
      const blob = await buildProgressShareCard({
        clientName: me.full_name,
        logoSrc: logo,
        before: comparison?.before || null,
        after: comparison?.after || null,
        deltaLines: deltaLines.length > 0 ? deltaLines : ['TIẾN ĐỘ'],
        periodLabel,
      })
      await shareOrDownload(blob, `prime-form-tien-do.png`)
    } catch (e) {
      if (e?.name !== 'AbortError') showToast(e.message || 'Không tạo được ảnh chia sẻ.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="screen stack fade-in">
      <div className="row-between">
        <div>
          <Eyebrow>Theo dõi</Eyebrow>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Tiến độ</h1>
        </div>
        {canShare && (
          <button className="btn btn-ghost btn-sm" onClick={handleShare} disabled={sharing}>
            <IconShare width={15} height={15} /> {sharing ? 'Đang tạo…' : 'Chia sẻ'}
          </button>
        )}
      </div>

      {hasMuscleData && (
        <Card className="stack">
          <Eyebrow muted>Nhóm cơ đã tập gần đây (30 ngày)</Eyebrow>
          <MuscleBodyMap heat={muscleHeat} />
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

          {comparisons.length > 0 && (
            <div className="stack">
              <Eyebrow muted>So sánh trước / sau</Eyebrow>
              {comparisons.map(({ angle, before, after }) => (
                <Card key={angle} className="stack">
                  <div className="eyebrow eyebrow-muted">{angle}</div>
                  <BeforeAfterSlider
                    beforeUrl={before.url} beforeLabel={`Tuần ${before.week}`}
                    afterUrl={after.url} afterLabel={`Tuần ${after.week}`}
                  />
                </Card>
              ))}
            </div>
          )}

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

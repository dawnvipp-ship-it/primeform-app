import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { listPrograms } from '../../data/programs'
import { getTodayLog, upsertTopSet } from '../../data/workoutLogs'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import { IconPlay } from '../../components/ui/Icons'

function Spec({ label, value }) {
  if (!value) return null
  return (
    <div style={{ minWidth: 52 }}>
      <div className="eyebrow eyebrow-muted">{label}</div>
      <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>{value}</div>
    </div>
  )
}

function ExerciseCard({ ex, clientId }) {
  const { db } = useAuth()
  const [topSet, setTopSet] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!ex.id) return
    getTodayLog(db, ex.id).then((log) => {
      if (log?.top_set_weight) setTopSet(log.top_set_weight)
    }).catch(() => {})
  }, [db, ex.id])

  return (
    <Card className="stack" style={{ padding: 'var(--s4)' }}>
      <div className="row" style={{ gap: 10, alignItems: 'baseline' }}>
        {ex.group_label && <span className="tag tag-accent" style={{ padding: '2px 8px' }}>{ex.group_label}</span>}
        <div className="pf-display" style={{ fontSize: 18 }}>{ex.exercise_name}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <Spec label="Sets" value={ex.sets} />
        <Spec label="Reps" value={ex.reps} />
        <Spec label="Mức tạ" value={ex.load} />
        <Spec label="Tempo" value={ex.tempo} />
        <Spec label="Nghỉ" value={ex.rest} />
        <Spec label="RPE" value={ex.rpe} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--pf-muted)', minWidth: 80 }}>Top set hôm nay</span>
        <input
          type="text"
          value={topSet}
          onChange={(e) => setTopSet(e.target.value)}
          onBlur={async () => {
            if (!topSet.trim()) return
            setSaving(true)
            try { await upsertTopSet(db, clientId, ex.id, topSet.trim()) }
            finally { setSaving(false) }
          }}
          placeholder={ex.load || 'VD: 60kg'}
          style={{
            background: 'var(--pf-surface-2)',
            border: '1px solid var(--pf-line)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13,
            color: 'var(--pf-text)',
            width: 100,
          }}
        />
        {saving && <span style={{ fontSize: 11, color: 'var(--pf-muted)' }}>…</span>}
      </div>
      {ex.coaching_cue && (
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, borderLeft: '2px solid var(--pf-line)', paddingLeft: 12 }}>
          {ex.coaching_cue}
        </p>
      )}
      {ex.notes && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--pf-accent)', borderLeft: '2px solid var(--pf-accent)', paddingLeft: 12 }}>
          {ex.notes}
        </p>
      )}
      {ex.video_url && (
        <a href={ex.video_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          <IconPlay width={16} height={16} /> Xem video
        </a>
      )}
    </Card>
  )
}

export default function Program() {
  const { db } = useAuth()
  const [activePhase, setActivePhase] = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const programs = me ? await listPrograms(db, me.id) : []
    return { programs, clientId: me?.id }
  }, [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  const programs = data?.programs || []
  const clientId = data?.clientId

  const phases = []
  programs.forEach((p) => {
    const ph = p.phase || 'Chưa phân phase'
    if (!phases.includes(ph)) phases.push(ph)
  })

  const selectedPhase = activePhase ?? phases[0] ?? null
  const phaseDays = programs.filter((p) => (p.phase || 'Chưa phân phase') === selectedPhase)
  const cur = phaseDays[activeDay] ?? phaseDays[0] ?? null

  function selectPhase(ph) {
    setActivePhase(ph)
    setActiveDay(0)
  }

  return (
    <div className="screen stack fade-in">
      <div>
        <Eyebrow>Chương trình</Eyebrow>
        <h1 style={{ fontSize: 28, marginTop: 6 }}>Giáo án</h1>
      </div>

      {programs.length === 0 ? (
        <Empty title="Chưa có giáo án" hint="HLV đang hoàn thiện chương trình cho bạn." />
      ) : (
        <>
          {phases.length > 1 && (
            <div className="seg-tabs">
              {phases.map((ph) => (
                <button
                  key={ph}
                  onClick={() => selectPhase(ph)}
                  className={`seg-tab seg-tab-accent${ph === selectedPhase ? ' active' : ''}`}
                >
                  {ph}
                </button>
              ))}
            </div>
          )}

          <div className="seg-tabs">
            {phaseDays.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveDay(i)}
                className={`seg-tab${i === activeDay ? ' active' : ''}`}
              >
                {p.workout_day || `Ngày ${i + 1}`}
              </button>
            ))}
          </div>

          {cur && (
            <>
              <div className="row-between" style={{ alignItems: 'flex-end' }}>
                <div className="pf-display" style={{ fontSize: 20 }}>{cur.workout_day}</div>
                {cur.week && <div className="eyebrow eyebrow-muted">Tuần {cur.week}</div>}
              </div>
              <div className="divider" />
              {(cur.program_exercises || []).map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} clientId={clientId} />
              ))}
              {(cur.program_exercises || []).length === 0 && <Empty title="Chưa có bài tập cho ngày này" />}
            </>
          )}
        </>
      )}
    </div>
  )
}

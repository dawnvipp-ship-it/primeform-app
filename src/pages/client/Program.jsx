import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { getMyClient } from '../../data/clients'
import { listPrograms } from '../../data/programs'
import { InlineLoader, Eyebrow, Card, Empty } from '../../components/ui/primitives'
import { IconPlay } from '../../components/ui/Icons'

function Spec({ label, value }) {
  if (!value) return null
  return (
    <div style={{ minWidth: 56 }}>
      <div className="eyebrow eyebrow-muted">{label}</div>
      <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>{value}</div>
    </div>
  )
}

function ExerciseCard({ ex }) {
  return (
    <Card className="stack">
      <div className="pf-display" style={{ fontSize: 18 }}>{ex.exercise_name}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
        <Spec label="Sets" value={ex.sets} />
        <Spec label="Reps" value={ex.reps} />
        <Spec label="Tempo" value={ex.tempo} />
        <Spec label="Nghỉ" value={ex.rest} />
        <Spec label="RPE" value={ex.rpe} />
      </div>
      {ex.coaching_cue && (
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, borderLeft: '2px solid var(--pf-line)', paddingLeft: 12 }}>
          {ex.coaching_cue}
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
  const [active, setActive] = useState(0)
  const { data, loading } = useAsync(async () => {
    const me = await getMyClient(db)
    const programs = me ? await listPrograms(db, me.id) : []
    return { programs }
  }, [db])

  if (loading) return <div className="screen"><InlineLoader /></div>
  const programs = data?.programs || []

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
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {programs.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActive(i)}
                className="btn btn-sm"
                style={{
                  background: i === active ? 'var(--pf-accent)' : 'transparent',
                  color: i === active ? '#0B0B0B' : 'var(--pf-muted)',
                  border: i === active ? 'none' : '1px solid var(--pf-line)',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.workout_day || `Ngày ${i + 1}`}
              </button>
            ))}
          </div>

          {programs[active] && (
            <>
              <div className="muted" style={{ fontSize: 13 }}>
                {[programs[active].phase, programs[active].week && `Tuần ${programs[active].week}`].filter(Boolean).join(' · ')}
              </div>
              {(programs[active].program_exercises || []).map((ex) => (
                <ExerciseCard key={ex.id} ex={ex} />
              ))}
              {(programs[active].program_exercises || []).length === 0 && (
                <Empty title="Chưa có bài tập cho ngày này" />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

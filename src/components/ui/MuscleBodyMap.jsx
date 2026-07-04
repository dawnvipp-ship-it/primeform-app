import { useEffect, useRef } from 'react'
import { BodyChart, ViewSide } from 'body-muscles'
import { toBodyState } from '../../data/muscleGroups'

function BodyView({ side, bodyState }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    chartRef.current = new BodyChart(ref.current, { view: side, bodyState: {} })
    return () => chartRef.current?.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side])

  useEffect(() => {
    chartRef.current?.update({ bodyState })
  }, [bodyState])

  return <div ref={ref} style={{ width: '100%' }} />
}

// heat: { [muscleGroupId]: 0..1 } from computeMuscleHeat, using this app's
// simplified 16-group taxonomy - expanded to the library's granular per-side
// muscle IDs via toBodyState.
export default function MuscleBodyMap({ heat = {} }) {
  const bodyState = toBodyState(heat)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <BodyView side={ViewSide.FRONT} bodyState={bodyState} />
        <div className="eyebrow eyebrow-muted" style={{ textAlign: 'center', marginTop: 4 }}>Mặt trước</div>
      </div>
      <div>
        <BodyView side={ViewSide.BACK} bodyState={bodyState} />
        <div className="eyebrow eyebrow-muted" style={{ textAlign: 'center', marginTop: 4 }}>Mặt sau</div>
      </div>
    </div>
  )
}

// Simplified front/back body map - each muscle group is a single blob shape
// (not anatomically precise, but consistent and legible), filled with the
// app's gold accent at an opacity that encodes recent training frequency.
// heat = { [muscleGroupId]: 0..1 }

const HEAT_COLOR = '#C9A961' // var(--pf-gold)
const OUTLINE = 'var(--pf-line)'

function fillFor(heat, id) {
  const v = heat?.[id] ?? 0
  return { fill: HEAT_COLOR, fillOpacity: 0.08 + 0.72 * v, stroke: OUTLINE, strokeWidth: 1 }
}

function Region({ id, heat, shape, title }) {
  const style = fillFor(heat, id)
  return (
    <g style={{ transition: 'fill-opacity 300ms ease' }}>
      {shape(style)}
      {title && <title>{title}</title>}
    </g>
  )
}

function FrontBody({ heat, labels }) {
  return (
    <svg viewBox="0 0 200 440" width="100%" height="100%">
      <circle cx="100" cy="26" r="18" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <rect x="91" y="42" width="18" height="10" rx="3" fill="none" stroke={OUTLINE} strokeWidth="1" />

      <Region id="front_delts" heat={heat} title={labels.front_delts} shape={(s) => (
        <><ellipse cx="64" cy="72" rx="13" ry="11" {...s} /><ellipse cx="136" cy="72" rx="13" ry="11" {...s} /></>
      )} />
      <Region id="side_delts" heat={heat} title={labels.side_delts} shape={(s) => (
        <><ellipse cx="51" cy="88" rx="9" ry="13" {...s} /><ellipse cx="149" cy="88" rx="9" ry="13" {...s} /></>
      )} />
      <Region id="chest" heat={heat} title={labels.chest} shape={(s) => (
        <ellipse cx="100" cy="98" rx="36" ry="20" {...s} />
      )} />
      <Region id="biceps" heat={heat} title={labels.biceps} shape={(s) => (
        <><ellipse cx="45" cy="128" rx="10" ry="22" {...s} /><ellipse cx="155" cy="128" rx="10" ry="22" {...s} /></>
      )} />
      <Region id="forearms" heat={heat} title={labels.forearms} shape={(s) => (
        <><ellipse cx="41" cy="178" rx="8" ry="26" {...s} /><ellipse cx="159" cy="178" rx="8" ry="26" {...s} /></>
      )} />
      <Region id="abs" heat={heat} title={labels.abs} shape={(s) => (
        <rect x="82" y="120" width="36" height="52" rx="10" {...s} />
      )} />
      <Region id="obliques" heat={heat} title={labels.obliques} shape={(s) => (
        <><ellipse cx="69" cy="142" rx="8" ry="30" {...s} /><ellipse cx="131" cy="142" rx="8" ry="30" {...s} /></>
      )} />
      <Region id="quads" heat={heat} title={labels.quads} shape={(s) => (
        <><ellipse cx="80" cy="255" rx="19" ry="48" {...s} /><ellipse cx="120" cy="255" rx="19" ry="48" {...s} /></>
      )} />
      <Region id="calves" heat={heat} title={labels.calves} shape={(s) => (
        <><ellipse cx="80" cy="355" rx="13" ry="32" {...s} /><ellipse cx="120" cy="355" rx="13" ry="32" {...s} /></>
      )} />

      <circle cx="40" cy="205" r="6" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="160" cy="205" r="6" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="80" cy="400" rx="11" ry="7" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="120" cy="400" rx="11" ry="7" fill="none" stroke={OUTLINE} strokeWidth="1" />
    </svg>
  )
}

function BackBody({ heat, labels }) {
  return (
    <svg viewBox="0 0 200 440" width="100%" height="100%">
      <circle cx="100" cy="26" r="18" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <rect x="91" y="42" width="18" height="10" rx="3" fill="none" stroke={OUTLINE} strokeWidth="1" />

      <Region id="traps" heat={heat} title={labels.traps} shape={(s) => (
        <ellipse cx="100" cy="66" rx="30" ry="16" {...s} />
      )} />
      <Region id="rear_delts" heat={heat} title={labels.rear_delts} shape={(s) => (
        <><ellipse cx="64" cy="76" rx="13" ry="11" {...s} /><ellipse cx="136" cy="76" rx="13" ry="11" {...s} /></>
      )} />
      <Region id="lats" heat={heat} title={labels.lats} shape={(s) => (
        <><ellipse cx="72" cy="115" rx="18" ry="30" {...s} /><ellipse cx="128" cy="115" rx="18" ry="30" {...s} /></>
      )} />
      <Region id="triceps" heat={heat} title={labels.triceps} shape={(s) => (
        <><ellipse cx="45" cy="128" rx="10" ry="22" {...s} /><ellipse cx="155" cy="128" rx="10" ry="22" {...s} /></>
      )} />
      <Region id="forearms" heat={heat} title={labels.forearms} shape={(s) => (
        <><ellipse cx="41" cy="178" rx="8" ry="26" {...s} /><ellipse cx="159" cy="178" rx="8" ry="26" {...s} /></>
      )} />
      <Region id="lower_back" heat={heat} title={labels.lower_back} shape={(s) => (
        <rect x="85" y="150" width="30" height="28" rx="8" {...s} />
      )} />
      <Region id="glutes" heat={heat} title={labels.glutes} shape={(s) => (
        <><ellipse cx="78" cy="200" rx="20" ry="22" {...s} /><ellipse cx="122" cy="200" rx="20" ry="22" {...s} /></>
      )} />
      <Region id="hamstrings" heat={heat} title={labels.hamstrings} shape={(s) => (
        <><ellipse cx="80" cy="255" rx="19" ry="48" {...s} /><ellipse cx="120" cy="255" rx="19" ry="48" {...s} /></>
      )} />
      <Region id="calves" heat={heat} title={labels.calves} shape={(s) => (
        <><ellipse cx="80" cy="355" rx="13" ry="32" {...s} /><ellipse cx="120" cy="355" rx="13" ry="32" {...s} /></>
      )} />

      <circle cx="40" cy="205" r="6" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <circle cx="160" cy="205" r="6" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="80" cy="400" rx="11" ry="7" fill="none" stroke={OUTLINE} strokeWidth="1" />
      <ellipse cx="120" cy="400" rx="11" ry="7" fill="none" stroke={OUTLINE} strokeWidth="1" />
    </svg>
  )
}

export default function MuscleBodyMap({ heat = {}, labels = {} }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <FrontBody heat={heat} labels={labels} />
        <div className="eyebrow eyebrow-muted" style={{ textAlign: 'center', marginTop: 4 }}>Mặt trước</div>
      </div>
      <div>
        <BackBody heat={heat} labels={labels} />
        <div className="eyebrow eyebrow-muted" style={{ textAlign: 'center', marginTop: 4 }}>Mặt sau</div>
      </div>
    </div>
  )
}

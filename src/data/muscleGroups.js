// Fixed taxonomy - a workout day is tagged with whichever of these it hits
// (coach picks per day, not per exercise, to keep tagging effort low). Each
// entry says which body-map view(s) it renders on.
export const MUSCLE_GROUPS = [
  { id: 'front_delts', label: 'Vai trước', view: 'front' },
  { id: 'side_delts', label: 'Vai giữa', view: 'front' },
  { id: 'chest', label: 'Ngực', view: 'front' },
  { id: 'biceps', label: 'Tay trước (Biceps)', view: 'front' },
  { id: 'forearms', label: 'Cẳng tay', view: 'both' },
  { id: 'abs', label: 'Bụng', view: 'front' },
  { id: 'obliques', label: 'Liên sườn', view: 'front' },
  { id: 'quads', label: 'Đùi trước', view: 'front' },
  { id: 'traps', label: 'Cầu vai (Traps)', view: 'back' },
  { id: 'rear_delts', label: 'Vai sau', view: 'back' },
  { id: 'lats', label: 'Xô (Lats)', view: 'back' },
  { id: 'triceps', label: 'Tay sau (Triceps)', view: 'back' },
  { id: 'lower_back', label: 'Lưng dưới', view: 'back' },
  { id: 'glutes', label: 'Mông', view: 'back' },
  { id: 'hamstrings', label: 'Đùi sau', view: 'back' },
  { id: 'calves', label: 'Bắp chân', view: 'back' },
]

export const MUSCLE_LABEL = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m.label]))

// Expands each simplified group (what the coach ticks, one tag per day) into
// the `body-muscles` library's actual per-side/sub-region IDs - the library
// has 70+ granular muscles, but tagging that precisely per workout day isn't
// realistic, so both sides/sub-regions of a group light up together.
export const LIBRARY_MUSCLE_IDS = {
  front_delts: ['shoulder-front-left', 'shoulder-front-right'],
  side_delts: ['shoulder-side-left', 'shoulder-side-right'],
  chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  biceps: ['biceps-left', 'biceps-right'],
  forearms: [
    'forearm-left', 'forearm-right',
    'forearm-flexors-left', 'forearm-extensors-left', 'forearm-flexors-right', 'forearm-extensors-right',
  ],
  abs: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  obliques: ['obliques-left', 'obliques-right'],
  quads: ['quads-left', 'quads-right'],
  traps: ['traps-upper-left', 'traps-mid-left', 'traps-lower-left', 'traps-upper-right', 'traps-mid-right', 'traps-lower-right'],
  rear_delts: ['deltoid-rear-left', 'deltoid-rear-right'],
  lats: ['lats-upper-left', 'lats-mid-left', 'lats-lower-left', 'lats-upper-right', 'lats-mid-right', 'lats-lower-right'],
  triceps: ['triceps-long-left', 'triceps-lateral-left', 'triceps-long-right', 'triceps-lateral-right'],
  lower_back: ['lower-back-erectors-left', 'lower-back-ql-left', 'lower-back-erectors-right', 'lower-back-ql-right'],
  glutes: ['gluteus-medius-left', 'gluteus-maximus-left', 'gluteus-medius-right', 'gluteus-maximus-right'],
  hamstrings: ['hamstrings-medial-left', 'hamstrings-lateral-left', 'hamstrings-medial-right', 'hamstrings-lateral-right'],
  calves: [
    'calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left',
    'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right',
  ],
}

// heat: { [groupId]: 0..1 } (from computeMuscleHeat) -> bodyState shape the
// BodyChart expects: { [libraryMuscleId]: { intensity: 0..10 } }.
export function toBodyState(heat) {
  const state = {}
  Object.entries(heat).forEach(([groupId, value]) => {
    const ids = LIBRARY_MUSCLE_IDS[groupId]
    if (!ids) return
    ids.forEach((id) => { state[id] = { intensity: Math.round(value * 10) } })
  })
  return state
}

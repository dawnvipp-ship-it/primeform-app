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
  { id: 'calves', label: 'Bắp chân', view: 'both' },
]

export const MUSCLE_LABEL = Object.fromEntries(MUSCLE_GROUPS.map((m) => [m.id, m.label]))

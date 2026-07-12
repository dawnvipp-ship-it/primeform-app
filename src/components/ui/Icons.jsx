// Minimal line icons — single stroke weight, no fills, to match the editorial feel.
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
}

export const IconHome = (p) => (<svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>)
export const IconClipboard = (p) => (<svg {...base} {...p}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 9h6M9 13h6M9 17h4" /></svg>)
export const IconDumbbell = (p) => (<svg {...base} {...p}><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" /></svg>)
export const IconLeaf = (p) => (<svg {...base} {...p}><path d="M5 19c0-7 5-12 14-13 0 9-6 14-13 14" /><path d="M5 19c2-4 4-6 8-8" /></svg>)
export const IconChart = (p) => (<svg {...base} {...p}><path d="M4 20V4M4 20h16" /><path d="M8 16l3-4 3 2 4-6" /></svg>)
export const IconTicket = (p) => (<svg {...base} {...p}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a2 2 0 0 0 0 6v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-6Z" /></svg>)
export const IconLogout = (p) => (<svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>)
export const IconPlus = (p) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>)
export const IconChevron = (p) => (<svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>)
export const IconBack = (p) => (<svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>)
export const IconTrash = (p) => (<svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>)
export const IconPlay = (p) => (<svg {...base} {...p}><path d="M8 5v14l11-7z" /></svg>)
export const IconCalendar = (p) => (<svg {...base} {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></svg>)
export const IconCheck = (p) => (<svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>)
export const IconX = (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>)
export const IconEdit = (p) => (<svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>)
export const IconDroplet = (p) => (<svg {...base} {...p}><path d="M12 3c4 5 7 9 7 12.5a7 7 0 1 1-14 0C5 12 8 8 12 3Z" /></svg>)
export const IconMoon = (p) => (<svg {...base} {...p}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" /></svg>)
export const IconShare = (p) => (<svg {...base} {...p}><path d="M12 15V3" /><path d="M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>)
export const IconMessage = (p) => (<svg {...base} {...p}><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4Z" /></svg>)
export const IconSend = (p) => (<svg {...base} {...p}><path d="M4 12 20 4l-6 16-3-7-7-3Z" /></svg>)

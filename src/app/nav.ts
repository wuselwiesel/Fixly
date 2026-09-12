import { BarChart3, CalendarDays, Home, LayoutDashboard, Settings, Wallet } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/kosten', label: 'Kosten', icon: Wallet, end: false },
  { to: '/kalender', label: 'Kalender', icon: CalendarDays, end: false },
  { to: '/auswertungen', label: 'Auswertungen', icon: BarChart3, end: false },
  { to: '/haushalt', label: 'Haushalt', icon: Home, end: false },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings, end: false },
] as const

/**
 * The bottom tab bar only has room for so many comfortable, well-spaced
 * targets. Settings is low-frequency, so on mobile it lives in the top bar
 * instead of competing for space in the tab bar.
 */
export const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((item) => item.to !== '/einstellungen')

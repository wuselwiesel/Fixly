import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MOBILE_TAB_ITEMS } from './nav'

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-3 z-40 flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur lg:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      {MOBILE_TAB_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium text-muted-foreground transition-colors',
              isActive ? 'bg-accent text-accent-foreground' : 'active:bg-muted',
            )
          }
        >
          <Icon className="size-5" />
          <span className="max-w-full truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

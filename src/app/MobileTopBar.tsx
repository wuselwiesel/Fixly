import { Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <img src="/icon.png" alt="" className="size-7 rounded-lg" />
        <span className="text-base font-semibold tracking-tight">Fixly</span>
      </div>
      <NavLink
        to="/einstellungen"
        aria-label="Einstellungen"
        className={({ isActive }) =>
          cn(
            'flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors',
            isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-muted hover:text-foreground',
          )
        }
      >
        <Settings className="size-5" />
      </NavLink>
    </header>
  )
}

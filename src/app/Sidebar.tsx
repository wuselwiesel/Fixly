import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCostFormStore } from '@/store/costFormStore'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav'

export function Sidebar() {
  const openCreate = useCostFormStore((s) => s.openCreate)

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r border-border bg-card px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <img src="/icon.png" alt="" className="size-9 rounded-xl" />
        <span className="text-lg font-semibold">Fixly</span>
      </div>

      <Button onClick={openCreate} className="justify-start gap-2">
        <Plus className="size-4" />
        Kosten hinzufügen
      </Button>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                isActive && 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="size-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

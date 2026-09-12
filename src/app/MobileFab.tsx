import { Plus } from 'lucide-react'
import { useCostFormStore } from '@/store/costFormStore'

export function MobileFab() {
  const openCreate = useCostFormStore((s) => s.openCreate)
  return (
    <button
      onClick={openCreate}
      aria-label="Kosten hinzufügen"
      className="fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      <Plus className="size-6" />
    </button>
  )
}

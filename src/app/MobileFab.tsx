import { Plus } from 'lucide-react'
import { useCostFormStore } from '@/store/costFormStore'

export function MobileFab() {
  const openCreate = useCostFormStore((s) => s.openCreate)
  return (
    <button
      onClick={openCreate}
      aria-label="Kosten hinzufügen"
      className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
    >
      <Plus className="size-6" />
    </button>
  )
}

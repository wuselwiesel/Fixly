import { MoreHorizontal } from 'lucide-react'
import { CATEGORY_ICONS } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string
  color: string
  className?: string
}) {
  const Icon = CATEGORY_ICONS[icon] ?? MoreHorizontal
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', className)}
      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
    >
      <Icon className="size-4.5" />
    </span>
  )
}

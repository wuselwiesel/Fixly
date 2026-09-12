import {
  AppWindow,
  Car,
  Clapperboard,
  Heart,
  Home,
  Landmark,
  type LucideIcon,
  MoreHorizontal,
  PawPrint,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Home,
  Zap,
  ShieldCheck,
  Car,
  Smartphone,
  Clapperboard,
  AppWindow,
  Users,
  Landmark,
  Heart,
  PawPrint,
  Stethoscope,
  MoreHorizontal,
}

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string
  color: string
  className?: string
}) {
  const Icon = ICONS[icon] ?? MoreHorizontal
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', className)}
      style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
    >
      <Icon className="size-4.5" />
    </span>
  )
}

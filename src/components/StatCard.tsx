import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  emphasis = false,
  /** A palette color (e.g. "var(--color-chart-2)") to tint the icon badge with, when not emphasized. */
  accentColor,
  className,
}: {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  emphasis?: boolean
  accentColor?: string
  className?: string
}) {
  return (
    <Card className={cn(emphasis && 'bg-primary text-primary-foreground border-transparent', className)}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className={cn(
              'truncate text-sm font-medium',
              emphasis ? 'text-primary-foreground/80' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          <span className="text-xl font-semibold tracking-tight break-words sm:text-2xl">{value}</span>
          {sub && (
            <span className={cn('text-xs', emphasis ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{sub}</span>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl',
              emphasis ? 'bg-white/15' : !accentColor && 'bg-muted',
            )}
            style={
              !emphasis && accentColor
                ? { backgroundColor: `color-mix(in oklch, ${accentColor} 18%, transparent)`, color: accentColor }
                : undefined
            }
          >
            <Icon className="size-4.5" />
          </span>
        )}
      </CardContent>
    </Card>
  )
}

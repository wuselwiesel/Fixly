import {
  Archive,
  ArchiveRestore,
  History,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Star,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useHousehold } from '@/features/household/useHousehold'
import { deleteCost, restoreCost, setCostStatus, toggleFavorite, usePriceChanges } from '@/hooks/useCosts'
import { useProfile } from '@/hooks/useProfile'
import { INTERVAL_LABELS, toMonthlyAmount } from '@/lib/calculations'
import { getCancellationInfo } from '@/lib/dates'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useCostFormStore } from '@/store/costFormStore'
import type { Category, Cost } from '@/types'

const URGENCY_VARIANT = {
  urgent: 'destructive',
  warning: 'warning',
  info: 'muted',
  none: undefined,
} as const

export function CostRow({ cost, category }: { cost: Cost; category?: Category }) {
  const openEdit = useCostFormStore((s) => s.openEdit)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cancellation = cost.type === 'contract' ? getCancellationInfo(cost) : null
  const priceChanges = usePriceChanges(cost.id)
  const { household } = useHousehold()
  const profile = useProfile()

  async function handleDelete() {
    const deleted = await deleteCost(cost.id)
    if (!deleted) return
    toast(`„${cost.name}“ gelöscht`, {
      action: {
        label: 'Rückgängig',
        onClick: () => restoreCost(deleted),
      },
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <CategoryIcon icon={category?.icon ?? 'MoreHorizontal'} color={category?.color ?? '#999'} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{cost.name}</span>
            {cost.isFavorite && <Star className="size-3.5 fill-warning text-warning" />}
            {cost.status === 'paused' && <Badge variant="muted">pausiert</Badge>}
            {household && (
              <Badge variant={cost.scope === 'household' ? 'default' : 'outline'}>
                {cost.scope === 'household'
                  ? 'Haushalt · Gemeinsam'
                  : profile?.personalSharingEnabled
                    ? 'Persönlich · Geteilt'
                    : 'Persönlich · Nicht geteilt'}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {category?.name} · {INTERVAL_LABELS[cost.interval]} · nächste Zahlung {formatDate(cost.nextPayment)}
          </span>
          {cancellation?.urgency && cancellation.urgency !== 'none' && cancellation.daysUntilDeadline !== null && (
            <Badge variant={URGENCY_VARIANT[cancellation.urgency]} className="mt-1 w-fit">
              Kündigungsfrist endet in {cancellation.daysUntilDeadline} Tagen
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <div className="font-semibold">{formatCurrency(cost.amount)}</div>
          <div className="text-xs text-muted-foreground">{formatCurrency(toMonthlyAmount(cost))}/Monat</div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleFavorite(cost.id, !cost.isFavorite)}
            aria-label="Favorit"
          >
            <Star className={cn('size-4', cost.isFavorite && 'fill-warning text-warning')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(cost)} aria-label="Bearbeiten">
            <Pencil className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mehr Aktionen">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {priceChanges.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <History className="size-4" />
                      Preisverlauf
                    </DropdownMenuItem>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" side="left">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Preisverlauf</p>
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {priceChanges.map((pc) => (
                        <li key={pc.id} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{formatDate(pc.changedAt.slice(0, 10))}</span>
                          <span>
                            {formatCurrency(pc.oldAmount)} → {formatCurrency(pc.newAmount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              )}
              {cost.status !== 'archived' && (
                <DropdownMenuItem
                  onClick={() => setCostStatus(cost.id, cost.status === 'paused' ? 'active' : 'paused')}
                >
                  {cost.status === 'paused' ? <Play className="size-4" /> : <Pause className="size-4" />}
                  {cost.status === 'paused' ? 'Fortsetzen' : 'Pausieren'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setCostStatus(cost.id, cost.status === 'archived' ? 'active' : 'archived')}
              >
                {cost.status === 'archived' ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                {cost.status === 'archived' ? 'Wiederherstellen' : 'Archivieren'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                <Trash2 className="size-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`„${cost.name}" löschen?`}
        description="Diese Kostenposition wird endgültig entfernt. Du kannst das direkt danach rückgängig machen."
        onConfirm={handleDelete}
      />
    </div>
  )
}

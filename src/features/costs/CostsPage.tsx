import { ArrowDownAZ, ArrowUpDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories, useCosts } from '@/hooks/useCosts'
import { sumMonthly, sumYearly, toMonthlyAmount } from '@/lib/calculations'
import { cn, formatCurrency } from '@/lib/utils'
import { useCostFormStore } from '@/store/costFormStore'
import type { Cost, CostType } from '@/types'
import { CostRow } from './CostRow'

type TabValue = 'all' | 'subscription' | 'contract' | 'other' | 'archive'
type QuickFilter = 'all' | 'monthly' | 'yearly' | 'over50' | 'under20' | 'paused'
type SortKey = 'name' | 'amount' | 'nextPayment'

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'monthly', label: 'Monatlich' },
  { value: 'yearly', label: 'Jährlich' },
  { value: 'over50', label: 'Über 50 €' },
  { value: 'under20', label: 'Unter 20 €' },
  { value: 'paused', label: 'Pausiert' },
]

export function CostsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TabValue) ?? 'all'
  const costs = useCosts()
  const categories = useCategories()
  const openCreate = useCostFormStore((s) => s.openCreate)

  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('nextPayment')

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const byTab = useMemo(() => {
    if (tab === 'archive') return costs.filter((c) => c.status === 'archived')
    const nonArchived = costs.filter((c) => c.status !== 'archived')
    if (tab === 'all') return nonArchived
    if (tab === 'other') return nonArchived.filter((c) => c.type === 'fixed' || c.type === 'other')
    return nonArchived.filter((c) => c.type === (tab as CostType))
  }, [costs, tab])

  const filtered = useMemo(() => {
    let list = byTab

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.provider?.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      list = list.filter((c) => c.categoryId === categoryFilter)
    }
    switch (quickFilter) {
      case 'monthly':
        list = list.filter((c) => c.interval === 'monthly')
        break
      case 'yearly':
        list = list.filter((c) => c.interval === 'yearly')
        break
      case 'over50':
        list = list.filter((c) => toMonthlyAmount(c) > 50)
        break
      case 'under20':
        list = list.filter((c) => toMonthlyAmount(c) < 20)
        break
      case 'paused':
        list = list.filter((c) => c.status === 'paused')
        break
    }

    return [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'amount') return toMonthlyAmount(b) - toMonthlyAmount(a)
      return a.nextPayment.localeCompare(b.nextPayment)
    })
  }, [byTab, search, categoryFilter, quickFilter, sortKey])

  const activeInTab = filtered.filter((c) => c.status !== 'archived')
  const monthly = sumMonthly(activeInTab)
  const yearly = sumYearly(activeInTab)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kosten</h1>
          <p className="text-sm text-muted-foreground">Alle deine regelmäßigen Ausgaben an einem Ort.</p>
        </div>
        <Button onClick={openCreate} className="hidden sm:inline-flex">
          + Kosten hinzufügen
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setParams(v === 'all' ? {} : { tab: v })}>
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="subscription">Abos</TabsTrigger>
          <TabsTrigger value="contract">Verträge</TabsTrigger>
          <TabsTrigger value="other">Sonstige</TabsTrigger>
          <TabsTrigger value="archive">Archiv</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="flex flex-col gap-4">
          {tab !== 'archive' && (
            <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {activeInTab.length} {activeInTab.length === 1 ? 'Position' : 'Positionen'}
              </span>
              <span className="font-medium">
                {formatCurrency(monthly)}/Monat · {formatCurrency(yearly)}/Jahr
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="sm:w-48">
                  <ArrowUpDown className="size-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nextPayment">Nächste Zahlung</SelectItem>
                  <SelectItem value="amount">Betrag</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setQuickFilter(f.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    quickFilter === f.value
                      ? 'border-transparent bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ArrowDownAZ}
              title="Keine Kosten gefunden"
              description="Passe deine Filter an oder füge eine neue Kostenposition hinzu."
              action={
                <Button onClick={openCreate} variant="outline">
                  + Kosten hinzufügen
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((cost: Cost) => (
                <CostRow key={cost.id} cost={cost} category={categoryById.get(cost.categoryId)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

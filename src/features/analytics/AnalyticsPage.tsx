import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CategoryIcon } from '@/components/CategoryIcon'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategories, useCosts } from '@/hooks/useCosts'
import { INTERVAL_LABELS, sumDaily, sumMonthly, sumYearly, toMonthlyAmount } from '@/lib/calculations'
import { formatCurrency } from '@/lib/utils'
import type { CostInterval } from '@/types'
import { CalendarClock, Gauge, TrendingUp, Wallet } from 'lucide-react'

export function AnalyticsPage() {
  const allCosts = useCosts()
  const categories = useCategories()
  const active = useMemo(() => allCosts.filter((c) => c.status === 'active'), [allCosts])
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const monthly = sumMonthly(active)
  const yearly = sumYearly(active)
  const daily = sumDaily(active)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const cost of active) map.set(cost.categoryId, (map.get(cost.categoryId) ?? 0) + toMonthlyAmount(cost))
    return [...map.entries()]
      .map(([categoryId, amount]) => ({ category: categoryById.get(categoryId), amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [active, categoryById])

  const byInterval = useMemo(() => {
    const map = new Map<CostInterval, number>()
    for (const cost of active) map.set(cost.interval, (map.get(cost.interval) ?? 0) + 1)
    return (Object.keys(INTERVAL_LABELS) as CostInterval[])
      .map((interval) => ({ interval, count: map.get(interval) ?? 0 }))
      .filter((row) => row.count > 0)
  }, [active])

  const top5 = useMemo(() => [...active].sort((a, b) => toMonthlyAmount(b) - toMonthlyAmount(a)).slice(0, 5), [active])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auswertungen</h1>
        <p className="text-sm text-muted-foreground">Verstehe, wofür dein Geld wirklich draufgeht.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pro Monat" value={formatCurrency(monthly)} icon={Wallet} accentColor="var(--color-chart-1)" />
        <StatCard label="Pro Jahr" value={formatCurrency(yearly)} icon={CalendarClock} accentColor="var(--color-chart-2)" />
        <StatCard label="Pro Tag" value={formatCurrency(daily)} icon={Gauge} accentColor="var(--color-chart-3)" />
        <StatCard
          label="Aktive Kosten"
          value={String(active.length)}
          icon={TrendingUp}
          accentColor="var(--color-chart-4)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey={(d: { category?: { name: string } }) => d.category?.name ?? '—'}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={140}
                />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: 'var(--color-muted)' }} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {byCategory.map((row, i) => (
                    <Cell key={i} fill={row.category?.color ?? 'var(--color-chart-1)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 teuerste Kosten</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {top5.map((cost) => {
              const category = categoryById.get(cost.categoryId)
              return (
                <div key={cost.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2.5 text-sm">
                    <CategoryIcon icon={category?.icon ?? 'MoreHorizontal'} color={category?.color ?? '#999'} className="size-7" />
                    {cost.name}
                  </span>
                  <span className="font-medium">{formatCurrency(toMonthlyAmount(cost))}/Mo</span>
                </div>
              )
            })}
            {top5.length === 0 && <p className="py-4 text-sm text-muted-foreground">Noch keine Kosten erfasst.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nach Intervall</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byInterval.map((row) => (
              <div key={row.interval} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{INTERVAL_LABELS[row.interval]}</span>
                <span className="font-medium">{row.count} {row.count === 1 ? 'Position' : 'Positionen'}</span>
              </div>
            ))}
            {byInterval.length === 0 && <p className="py-4 text-sm text-muted-foreground">Noch keine Kosten erfasst.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

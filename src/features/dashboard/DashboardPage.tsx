import { AlertTriangle, CalendarClock, PiggyBank, Receipt, Repeat, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { StatCard } from '@/components/StatCard'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCategories, useCosts } from '@/hooks/useCosts'
import { sumDaily, sumMonthly, sumYearly, toMonthlyAmount } from '@/lib/calculations'
import { getCancellationInfo } from '@/lib/dates'
import { formatCurrency } from '@/lib/utils'
import type { Cost } from '@/types'

export function DashboardPage() {
  const allCosts = useCosts()
  const categories = useCategories()
  const active = useMemo(() => allCosts.filter((c) => c.status === 'active'), [allCosts])

  const monthlyTotal = sumMonthly(active)
  const yearlyTotal = sumYearly(active)
  const dailyTotal = sumDaily(active)

  const subscriptions = active.filter((c) => c.type === 'subscription')
  const contracts = active.filter((c) => c.type === 'contract')
  const other = active.filter((c) => c.type === 'fixed' || c.type === 'other')

  const categoryBreakdown = useMemo(() => {
    const byCategory = new Map<string, number>()
    for (const cost of active) {
      byCategory.set(cost.categoryId, (byCategory.get(cost.categoryId) ?? 0) + toMonthlyAmount(cost))
    }
    return categories
      .map((cat) => ({ id: cat.id, name: cat.name, color: cat.color, icon: cat.icon, amount: byCategory.get(cat.id) ?? 0 }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [active, categories])

  const top5 = useMemo(
    () => [...active].sort((a, b) => toMonthlyAmount(b) - toMonthlyAmount(a)).slice(0, 5),
    [active],
  )

  const urgentContracts = useMemo(
    () =>
      contracts
        .map((c) => ({ cost: c, info: getCancellationInfo(c) }))
        .filter((r) => r.info.urgency === 'urgent' || r.info.urgency === 'warning')
        .sort((a, b) => (a.info.daysUntilDeadline ?? 0) - (b.info.daysUntilDeadline ?? 0)),
    [contracts],
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">So viel kostet dich dein Leben gerade.</p>
      </div>

      {urgentContracts.length > 0 && (
        <div className="flex flex-col gap-2">
          {urgentContracts.map(({ cost, info }) => (
            <div
              key={cost.id}
              className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm"
            >
              <AlertTriangle className="size-4 shrink-0 text-warning-foreground" />
              <span>
                <strong>{cost.name}</strong>: Kündigungsfrist endet in {info.daysUntilDeadline} Tagen
                {cost.autoRenew ? ', sonst verlängert sich der Vertrag automatisch.' : '.'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Monatliche Fixkosten" value={formatCurrency(monthlyTotal)} icon={Wallet} emphasis />
        <StatCard
          label="Jährliche Fixkosten"
          value={formatCurrency(yearlyTotal)}
          icon={CalendarClock}
          accentColor="var(--color-chart-2)"
        />
        <StatCard
          label="Abos"
          value={`${formatCurrency(sumMonthly(subscriptions))} / Monat`}
          icon={Repeat}
          accentColor="var(--color-chart-3)"
        />
        <StatCard
          label="Verträge"
          value={`${formatCurrency(sumMonthly(contracts))} / Monat`}
          icon={Receipt}
          accentColor="var(--color-chart-4)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Kosten erfasst.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {categoryBreakdown.map((row) => (
                          <Cell key={row.id} fill={row.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex flex-1 flex-col gap-2">
                  {categoryBreakdown.slice(0, 5).map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.name}
                      </span>
                      <span className="font-medium">{formatCurrency(row.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teuerste Kosten</CardTitle>
          </CardHeader>
          <CardContent>
            {top5.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Kosten erfasst.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {top5.map((cost) => (
                  <TopCostRow key={cost.id} cost={cost} categoryColor={categories.find((c) => c.id === cost.categoryId)?.color ?? '#999'} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Was kostet mich mein Leben?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {categoryBreakdown.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Füge Kosten hinzu, um deine Lebenshaltungskosten zu sehen.</p>
          ) : (
            <>
              <ul className="flex flex-col divide-y divide-border">
                {categoryBreakdown.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="flex items-center gap-2.5 text-sm">
                      <CategoryIcon icon={row.icon} color={row.color} className="size-7" />
                      {row.name}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(row.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <PiggyBank className="size-4" /> Gesamt
                </span>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(monthlyTotal)} / Monat</div>
                  <div className="text-xs text-muted-foreground">
                    entspricht {formatCurrency(yearlyTotal)}/Jahr · {formatCurrency(dailyTotal)}/Tag
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {other.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Sonstige Fixkosten: {formatCurrency(sumMonthly(other))} / Monat
        </p>
      )}
    </div>
  )
}

function TopCostRow({ cost, categoryColor }: { cost: Cost; categoryColor: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-sm">
        <span className="size-2 rounded-full" style={{ backgroundColor: categoryColor }} />
        {cost.name}
      </span>
      <span className="flex items-center gap-2">
        <Badge variant="muted">{formatCurrency(toMonthlyAmount(cost))}/Mo</Badge>
      </span>
    </li>
  )
}

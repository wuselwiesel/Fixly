import { Home, User, Users } from 'lucide-react'
import { useMemo } from 'react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { StatCard } from '@/components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserId } from '@/features/auth/authStore'
import { useCategories } from '@/hooks/useCosts'
import { sumMonthly, toMonthlyAmount } from '@/lib/calculations'
import { getShareAmounts } from '@/lib/split'
import { formatCurrency } from '@/lib/utils'
import type { Cost, HouseholdMember } from '@/types'
import { useHouseholdCosts } from './useHousehold'

export function HouseholdOverview({ householdId, members }: { householdId: string; members: HouseholdMember[] }) {
  const myId = useUserId()
  const categories = useCategories()
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const memberIds = useMemo(() => members.map((m) => m.userId), [members])
  const costs = useHouseholdCosts(householdId, memberIds)

  const shared = costs.filter((c) => c.scope === 'household')
  const mine = costs.filter((c) => c.scope === 'personal' && c.userId === myId)
  const others = costs.filter((c) => c.scope === 'personal' && c.userId !== myId)

  const householdMonthly = sumMonthly(shared)
  const myPersonalMonthly = sumMonthly(mine)
  const otherPersonalMonthly = sumMonthly(others)
  const totalVisible = householdMonthly + myPersonalMonthly + otherPersonalMonthly

  const distribution = useMemo(() => {
    const totals = new Map(memberIds.map((id) => [id, 0]))
    for (const cost of shared) {
      const shares = getShareAmounts(cost, memberIds)
      for (const [userId, amount] of Object.entries(shares)) {
        totals.set(userId, (totals.get(userId) ?? 0) + toMonthlyAmount({ ...cost, amount }))
      }
    }
    for (const cost of [...mine, ...others]) {
      totals.set(cost.userId, (totals.get(cost.userId) ?? 0) + toMonthlyAmount(cost))
    }
    const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0)
    return members.map((m) => ({
      member: m,
      amount: totals.get(m.userId) ?? 0,
      percent: grandTotal > 0 ? ((totals.get(m.userId) ?? 0) / grandTotal) * 100 : 0,
    }))
  }, [shared, mine, others, memberIds, members])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Gesamte Haushaltskosten" value={`${formatCurrency(householdMonthly)} / Monat`} icon={Home} emphasis />
        <StatCard
          label="Meine persönlichen Kosten"
          value={`${formatCurrency(myPersonalMonthly)} / Monat`}
          icon={User}
          accentColor="var(--color-chart-2)"
        />
        <StatCard
          label="Gesamt sichtbar"
          value={`${formatCurrency(totalVisible)} / Monat`}
          icon={Users}
          accentColor="var(--color-chart-3)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kostenverteilung</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {distribution.map(({ member, amount, percent }) => (
            <div key={member.userId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span>{member.profile.displayName ?? member.profile.email}</span>
                <span className="font-medium">
                  {formatCurrency(amount)} · {percent.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <CostSection title="Gemeinsam" costs={shared} categoryById={categoryById} />
      <CostSection title="Meine Kosten" costs={mine} categoryById={categoryById} />
      {others.length > 0 && <CostSection title="Kosten der anderen Person" costs={others} categoryById={categoryById} />}
    </div>
  )
}

function CostSection({
  title,
  costs,
  categoryById,
}: {
  title: string
  costs: Cost[]
  categoryById: Map<string, { name: string; color: string; icon: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {costs.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Keine Kosten in diesem Bereich.</p>
        ) : (
          costs.map((cost) => {
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
          })
        )}
      </CardContent>
    </Card>
  )
}

import { addMonths, endOfMonth, format, isSameMonth, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CategoryIcon } from '@/components/CategoryIcon'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories, useCosts } from '@/hooks/useCosts'
import { getOccurrencesInRange } from '@/lib/dates'
import { formatCurrency } from '@/lib/utils'

export function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
        <p className="text-sm text-muted-foreground">Welche Zahlungen kommen wann auf dich zu?</p>
      </div>
      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Monat</TabsTrigger>
          <TabsTrigger value="year">Jahr</TabsTrigger>
        </TabsList>
        <TabsContent value="month">
          <MonthView />
        </TabsContent>
        <TabsContent value="year">
          <YearView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MonthView() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const costs = useCosts()
  const categories = useCategories()
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const occurrences = useMemo(() => {
    const active = costs.filter((c) => c.status === 'active')
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const rows = active.flatMap((cost) =>
      getOccurrencesInRange(cost, start, end).map((date) => ({ date, cost })),
    )
    return rows.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [costs, month])

  const today = new Date()
  const stillDue = occurrences.filter((o) => isSameMonth(month, today) && o.date >= today)
  const stillDueSum = stillDue.reduce((sum, o) => sum + o.cost.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-medium capitalize">{format(month, 'MMMM yyyy', { locale: de })}</span>
        <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {isSameMonth(month, today) && (
        <div className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <span className="text-sm font-medium">Noch fällig diesen Monat</span>
          <span className="font-semibold">{formatCurrency(stillDueSum)}</span>
        </div>
      )}

      {occurrences.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Keine Zahlungen" description="In diesem Monat sind keine Zahlungen fällig." />
      ) : (
        <div className="flex flex-col gap-2">
          {occurrences.map(({ date, cost }, i) => {
            const category = categoryById.get(cost.categoryId)
            const isPast = date < today
            return (
              <div
                key={`${cost.id}-${i}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex w-11 flex-col items-center justify-center rounded-xl bg-muted py-1.5 text-xs font-medium">
                    <span className="text-base leading-none">{format(date, 'dd')}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{format(date, 'MMM', { locale: de })}</span>
                  </div>
                  <CategoryIcon icon={category?.icon ?? 'MoreHorizontal'} color={category?.color ?? '#999'} />
                  <span className={isPast ? 'text-muted-foreground line-through' : 'font-medium'}>{cost.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(cost.amount)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function YearView() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const costs = useCosts()

  const data = useMemo(() => {
    const active = costs.filter((c) => c.status === 'active')
    const months = Array.from({ length: 12 }, (_, i) => startOfMonth(new Date(year, i, 1)))

    return months.map((m) => {
      const start = startOfMonth(m)
      const end = endOfMonth(m)
      const total = active.reduce((sum, cost) => {
        const occ = getOccurrencesInRange(cost, start, end)
        return sum + occ.length * cost.amount
      }, 0)
      return { month: format(m, 'MMM', { locale: de }), total }
    })
  }, [costs, year])

  const total = data.reduce((sum, d) => sum + d.total, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-medium">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fixkosten pro Monat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} cursor={{ fill: 'var(--color-muted)' }} />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">Gesamt {year}: {formatCurrency(total)}</p>
    </div>
  )
}

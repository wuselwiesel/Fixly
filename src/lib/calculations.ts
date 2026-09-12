import type { Cost, CostInterval } from '@/types'

/** Average days per interval, used to derive daily/monthly/yearly figures consistently. */
const INTERVAL_DAYS: Record<Exclude<CostInterval, 'custom'>, number> = {
  monthly: 365.25 / 12,
  bimonthly: (365.25 / 12) * 2,
  quarterly: (365.25 / 12) * 3,
  semiannual: (365.25 / 12) * 6,
  yearly: 365.25,
}

export function getIntervalDays(cost: Pick<Cost, 'interval' | 'customIntervalDays'>): number {
  if (cost.interval === 'custom') {
    return cost.customIntervalDays && cost.customIntervalDays > 0 ? cost.customIntervalDays : INTERVAL_DAYS.monthly
  }
  return INTERVAL_DAYS[cost.interval]
}

export function getDailyAmount(cost: Pick<Cost, 'amount' | 'interval' | 'customIntervalDays'>): number {
  return cost.amount / getIntervalDays(cost)
}

export function toMonthlyAmount(cost: Pick<Cost, 'amount' | 'interval' | 'customIntervalDays'>): number {
  return getDailyAmount(cost) * INTERVAL_DAYS.monthly
}

export function toYearlyAmount(cost: Pick<Cost, 'amount' | 'interval' | 'customIntervalDays'>): number {
  return getDailyAmount(cost) * INTERVAL_DAYS.yearly
}

export function sumMonthly(costs: Cost[]): number {
  return costs.reduce((sum, cost) => sum + toMonthlyAmount(cost), 0)
}

export function sumYearly(costs: Cost[]): number {
  return costs.reduce((sum, cost) => sum + toYearlyAmount(cost), 0)
}

export function sumDaily(costs: Cost[]): number {
  return costs.reduce((sum, cost) => sum + getDailyAmount(cost), 0)
}

export const INTERVAL_LABELS: Record<CostInterval, string> = {
  monthly: 'monatlich',
  bimonthly: 'alle 2 Monate',
  quarterly: 'vierteljährlich',
  semiannual: 'halbjährlich',
  yearly: 'jährlich',
  custom: 'individuell',
}

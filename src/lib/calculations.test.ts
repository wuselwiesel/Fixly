import { describe, expect, it } from 'vitest'
import { sumMonthly, sumYearly, toMonthlyAmount, toYearlyAmount } from './calculations'
import type { Cost } from '@/types'

function makeCost(overrides: Partial<Cost>): Cost {
  return {
    id: 'c1',
    userId: 'u1',
    scope: 'personal',
    name: 'Test',
    categoryId: 'cat1',
    type: 'other',
    amount: 0,
    interval: 'monthly',
    nextPayment: '2026-01-01',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

describe('toMonthlyAmount', () => {
  it('keeps monthly costs unchanged', () => {
    const cost = makeCost({ amount: 12.99, interval: 'monthly' })
    expect(toMonthlyAmount(cost)).toBeCloseTo(12.99, 2)
  })

  it('converts a yearly insurance to ~40€/month', () => {
    const cost = makeCost({ amount: 480, interval: 'yearly' })
    expect(toMonthlyAmount(cost)).toBeCloseTo(40, 1)
  })

  it('converts quarterly costs down to a monthly figure', () => {
    const cost = makeCost({ amount: 90, interval: 'quarterly' })
    expect(toMonthlyAmount(cost)).toBeCloseTo(30, 1)
  })

  it('supports a custom interval in days', () => {
    const cost = makeCost({ amount: 100, interval: 'custom', customIntervalDays: 10 })
    // 100€ every 10 days -> ~304.37€/month
    expect(toMonthlyAmount(cost)).toBeCloseTo(304.37, 1)
  })
})

describe('toYearlyAmount', () => {
  it('converts a monthly Netflix sub to yearly', () => {
    const cost = makeCost({ amount: 12.99, interval: 'monthly' })
    expect(toYearlyAmount(cost)).toBeCloseTo(12.99 * 12, 0)
  })
})

describe('sumMonthly / sumYearly', () => {
  it('aggregates mixed intervals consistently', () => {
    const costs = [
      makeCost({ amount: 750, interval: 'monthly' }), // rent
      makeCost({ amount: 480, interval: 'yearly' }), // insurance -> 40/mo
    ]
    expect(sumMonthly(costs)).toBeCloseTo(790, 0)
    expect(sumYearly(costs)).toBeCloseTo(790 * 12, -1)
  })
})

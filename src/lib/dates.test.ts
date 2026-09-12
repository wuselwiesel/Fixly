import { format, parseISO } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { getCancellationInfo, getOccurrencesInRange } from './dates'

const iso = (d: Date | null) => (d ? format(d, 'yyyy-MM-dd') : null)

describe('getOccurrencesInRange', () => {
  it('finds every monthly occurrence inside a month range', () => {
    const occurrences = getOccurrencesInRange(
      { nextPayment: '2026-09-05', interval: 'monthly' },
      parseISO('2026-09-01'),
      parseISO('2026-09-30'),
    )
    expect(occurrences).toHaveLength(1)
    expect(occurrences[0].getDate()).toBe(5)
  })

  it('projects a yearly cost forward into a future month if it falls inside it', () => {
    const occurrences = getOccurrencesInRange(
      { nextPayment: '2026-11-15', interval: 'yearly' },
      parseISO('2027-11-01'),
      parseISO('2027-11-30'),
    )
    expect(occurrences).toHaveLength(1)
  })

  it('returns nothing for months a yearly cost does not touch', () => {
    const occurrences = getOccurrencesInRange(
      { nextPayment: '2026-11-15', interval: 'yearly' },
      parseISO('2026-09-01'),
      parseISO('2026-09-30'),
    )
    expect(occurrences).toHaveLength(0)
  })
})

describe('getCancellationInfo', () => {
  it('computes the deadline as contractEnd minus the notice period', () => {
    const today = parseISO('2026-09-12')
    const info = getCancellationInfo(
      {
        contractEnd: '2026-11-14',
        cancellationPeriodDays: 30,
        autoRenew: true,
        interval: 'yearly',
      },
      today,
    )
    expect(iso(info.cancellationDeadline)).toBe('2026-10-15')
    expect(info.daysUntilDeadline).toBe(33)
    expect(info.urgency).toBe('warning')
  })

  it('marks urgent when the deadline is within 30 days', () => {
    const today = parseISO('2026-09-12')
    const info = getCancellationInfo(
      { contractEnd: '2026-10-10', cancellationPeriodDays: 7, autoRenew: false, interval: 'monthly' },
      today,
    )
    expect(info.urgency).toBe('urgent')
  })

  it('projects forward to the next cycle when the deadline already passed and autoRenew is on', () => {
    const today = parseISO('2026-09-12')
    const info = getCancellationInfo(
      { contractEnd: '2026-08-01', cancellationPeriodDays: 30, autoRenew: true, interval: 'yearly' },
      today,
    )
    // next renewal is 2027-08-01, deadline 2027-07-02
    expect(iso(info.renewalDate)).toBe('2027-08-01')
  })
})

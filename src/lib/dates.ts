import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  isBefore,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import type { Cost, CostInterval } from '@/types'

/** Steps an anchor date forward by exactly one occurrence of the given interval. */
export function stepForward(date: Date, interval: CostInterval, customIntervalDays?: number): Date {
  switch (interval) {
    case 'monthly':
      return addMonths(date, 1)
    case 'bimonthly':
      return addMonths(date, 2)
    case 'quarterly':
      return addMonths(date, 3)
    case 'semiannual':
      return addMonths(date, 6)
    case 'yearly':
      return addYears(date, 1)
    case 'custom':
      return addDays(date, customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 30)
  }
}

export function stepBackward(date: Date, interval: CostInterval, customIntervalDays?: number): Date {
  switch (interval) {
    case 'monthly':
      return addMonths(date, -1)
    case 'bimonthly':
      return addMonths(date, -2)
    case 'quarterly':
      return addMonths(date, -3)
    case 'semiannual':
      return addMonths(date, -6)
    case 'yearly':
      return addYears(date, -1)
    case 'custom':
      return addDays(date, -(customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 30))
  }
}

/**
 * Projects all occurrence dates of a cost's payment inside [rangeStart, rangeEnd],
 * anchored on its stored nextPayment date and stepped by its interval.
 */
export function getOccurrencesInRange(
  cost: Pick<Cost, 'nextPayment' | 'interval' | 'customIntervalDays'>,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const anchor = parseISO(cost.nextPayment)
  const occurrences: Date[] = []

  // walk backward from the anchor until we're before the range
  let cursor = anchor
  let guard = 0
  while (!isBefore(cursor, rangeStart) && guard < 1000) {
    cursor = stepBackward(cursor, cost.interval, cost.customIntervalDays)
    guard++
  }
  // walk forward, collecting everything inside the range
  guard = 0
  cursor = stepForward(cursor, cost.interval, cost.customIntervalDays)
  while (!isBefore(rangeEnd, cursor) && guard < 1000) {
    if (isWithinInterval(cursor, { start: rangeStart, end: rangeEnd })) {
      occurrences.push(cursor)
    }
    cursor = stepForward(cursor, cost.interval, cost.customIntervalDays)
    guard++
  }
  return occurrences
}

export function getDaysUntil(dateStr: string, from: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(dateStr), from)
}

export type CancellationUrgency = 'none' | 'info' | 'warning' | 'urgent'

export interface CancellationInfo {
  renewalDate: Date | null
  cancellationDeadline: Date | null
  daysUntilDeadline: number | null
  urgency: CancellationUrgency
}

/**
 * Derives the next cancellation deadline and renewal date for a contract.
 * cancellationDeadline = contractEnd - cancellationPeriodDays (last safe day to cancel).
 */
export function getCancellationInfo(
  cost: Pick<Cost, 'contractEnd' | 'cancellationPeriodDays' | 'autoRenew' | 'interval' | 'customIntervalDays'>,
  today: Date = new Date(),
): CancellationInfo {
  if (!cost.contractEnd) {
    return { renewalDate: null, cancellationDeadline: null, daysUntilDeadline: null, urgency: 'none' }
  }

  let renewalDate = parseISO(cost.contractEnd)
  const periodDays = cost.cancellationPeriodDays ?? 0
  let deadline = addDays(renewalDate, -periodDays)

  // if the deadline has already passed and the contract auto-renews, project to the next cycle
  if (cost.autoRenew) {
    let guard = 0
    while (isBefore(deadline, today) && guard < 1000) {
      renewalDate = stepForward(renewalDate, cost.interval, cost.customIntervalDays)
      deadline = addDays(renewalDate, -periodDays)
      guard++
    }
  }

  const daysUntilDeadline = differenceInCalendarDays(deadline, today)

  let urgency: CancellationUrgency = 'none'
  if (daysUntilDeadline < 0) {
    urgency = 'none'
  } else if (daysUntilDeadline <= 30) {
    urgency = 'urgent'
  } else if (daysUntilDeadline <= 90) {
    urgency = 'warning'
  } else {
    urgency = 'info'
  }

  return { renewalDate, cancellationDeadline: deadline, daysUntilDeadline, urgency }
}

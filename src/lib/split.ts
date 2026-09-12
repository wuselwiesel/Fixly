import type { Cost, SplitType } from '@/types'

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  equal: 'Gleich (50/50)',
  percentage: 'Prozent',
  amount: 'Fester Betrag',
}

/** Computes each member's share of a household cost's amount. */
export function getShareAmounts(cost: Pick<Cost, 'amount' | 'split'>, memberIds: string[]): Record<string, number> {
  if (memberIds.length === 0) return {}

  if (!cost.split || cost.split.type === 'equal') {
    const share = cost.amount / memberIds.length
    return Object.fromEntries(memberIds.map((id) => [id, share]))
  }

  const shares = cost.split.shares ?? {}

  if (cost.split.type === 'percentage') {
    return Object.fromEntries(memberIds.map((id) => [id, cost.amount * ((shares[id] ?? 0) / 100)]))
  }

  // fixed amount per member
  return Object.fromEntries(memberIds.map((id) => [id, shares[id] ?? 0]))
}

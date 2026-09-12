import type { Category, Cost, Household, HouseholdInvite, HouseholdMember, Income, PriceChange, Profile } from '@/types'

export function profileFromRow(row: any): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    personalSharingEnabled: row.personal_sharing_enabled,
    createdAt: row.created_at,
  }
}

export function categoryFromRow(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isCustom: row.is_custom,
    sortOrder: row.sort_order,
  }
}

export function costFromRow(row: any): Cost {
  return {
    id: row.id,
    userId: row.user_id,
    householdId: row.household_id,
    scope: row.scope,
    name: row.name,
    description: row.description ?? undefined,
    categoryId: row.category_id,
    type: row.type,
    amount: Number(row.amount),
    interval: row.interval,
    customIntervalDays: row.custom_interval_days ?? undefined,
    nextPayment: row.next_payment,
    paymentMethod: row.payment_method ?? undefined,
    provider: row.provider ?? undefined,
    website: row.website ?? undefined,
    contractStart: row.contract_start ?? undefined,
    contractEnd: row.contract_end ?? undefined,
    cancellationPeriodDays: row.cancellation_period_days ?? undefined,
    autoRenew: row.auto_renew ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    isFavorite: row.is_favorite ?? undefined,
    split: row.split ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function costToRow(input: Partial<Cost>) {
  const row: Record<string, unknown> = {}
  if (input.userId !== undefined) row.user_id = input.userId
  if (input.householdId !== undefined) row.household_id = input.householdId
  if (input.scope !== undefined) row.scope = input.scope
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description || null
  if (input.categoryId !== undefined) row.category_id = input.categoryId
  if (input.type !== undefined) row.type = input.type
  if (input.amount !== undefined) row.amount = input.amount
  if (input.interval !== undefined) row.interval = input.interval
  if (input.customIntervalDays !== undefined) row.custom_interval_days = input.customIntervalDays || null
  if (input.nextPayment !== undefined) row.next_payment = input.nextPayment
  if (input.paymentMethod !== undefined) row.payment_method = input.paymentMethod || null
  if (input.provider !== undefined) row.provider = input.provider || null
  if (input.website !== undefined) row.website = input.website || null
  if (input.contractStart !== undefined) row.contract_start = input.contractStart || null
  if (input.contractEnd !== undefined) row.contract_end = input.contractEnd || null
  if (input.cancellationPeriodDays !== undefined) row.cancellation_period_days = input.cancellationPeriodDays ?? null
  if (input.autoRenew !== undefined) row.auto_renew = input.autoRenew
  if (input.status !== undefined) row.status = input.status
  if (input.notes !== undefined) row.notes = input.notes || null
  if (input.isFavorite !== undefined) row.is_favorite = input.isFavorite
  if (input.split !== undefined) row.split = input.split ?? null
  return row
}

export function incomeFromRow(row: any): Income {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    amount: Number(row.amount),
    interval: row.interval,
    category: row.category,
    createdAt: row.created_at,
  }
}

export function priceChangeFromRow(row: any): PriceChange {
  return {
    id: row.id,
    costId: row.cost_id,
    oldAmount: Number(row.old_amount),
    newAmount: Number(row.new_amount),
    changedAt: row.changed_at,
  }
}

export function householdFromRow(row: any): Household {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  }
}

export function householdMemberFromRow(row: any): HouseholdMember {
  return {
    householdId: row.household_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    profile: profileFromRow(row.profiles ?? row.profile),
  }
}

export function householdInviteFromRow(row: any): HouseholdInvite {
  return {
    id: row.id,
    householdId: row.household_id,
    code: row.code,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    usedBy: row.used_by,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }
}

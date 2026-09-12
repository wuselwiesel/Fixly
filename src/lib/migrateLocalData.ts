import { db as legacyDb } from './db'
import { useRefreshBus } from './refreshBus'
import { supabase } from './supabase'

const FLAG_KEY = 'fixly-local-migration-done'

export function isMigrationDismissed(): boolean {
  return localStorage.getItem(FLAG_KEY) === '1'
}

export function dismissMigration() {
  localStorage.setItem(FLAG_KEY, '1')
}

export async function hasLocalDataToOffer(): Promise<boolean> {
  if (isMigrationDismissed()) return false
  try {
    const count = await legacyDb.costs.count()
    return count > 0
  } catch {
    return false
  }
}

/** Imports the old local (pre-account) Dexie data into the signed-in user's cloud account. */
export async function migrateLocalData(userId: string) {
  const [localCosts, localCategories, localPriceChanges] = await Promise.all([
    legacyDb.costs.toArray(),
    legacyDb.categories.toArray(),
    legacyDb.priceChanges.toArray(),
  ])

  const { data: cloudCategories, error: catFetchError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
  if (catFetchError) throw catFetchError

  const categoryIdByName = new Map((cloudCategories ?? []).map((c) => [c.name, c.id as string]))
  const categoryIdMap = new Map<string, string>()

  for (const cat of localCategories) {
    const existingId = categoryIdByName.get(cat.name)
    if (existingId) {
      categoryIdMap.set(cat.id, existingId)
      continue
    }
    const { data: inserted, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: cat.name, color: cat.color, icon: cat.icon, is_custom: true })
      .select('id')
      .single()
    if (error) throw error
    categoryIdMap.set(cat.id, inserted.id as string)
    categoryIdByName.set(cat.name, inserted.id as string)
  }

  const costRows = localCosts
    .filter((cost) => categoryIdMap.has(cost.categoryId))
    .map((cost) => ({
      id: cost.id,
      user_id: userId,
      household_id: null,
      scope: 'personal' as const,
      name: cost.name,
      description: cost.description || null,
      category_id: categoryIdMap.get(cost.categoryId),
      type: cost.type,
      amount: cost.amount,
      interval: cost.interval,
      custom_interval_days: cost.customIntervalDays ?? null,
      next_payment: cost.nextPayment,
      payment_method: cost.paymentMethod || null,
      provider: cost.provider || null,
      website: cost.website || null,
      contract_start: cost.contractStart || null,
      contract_end: cost.contractEnd || null,
      cancellation_period_days: cost.cancellationPeriodDays ?? null,
      auto_renew: cost.autoRenew ?? false,
      status: cost.status,
      notes: cost.notes || null,
      is_favorite: cost.isFavorite ?? false,
    }))

  if (costRows.length > 0) {
    const { error } = await supabase.from('costs').insert(costRows)
    if (error) throw error
  }

  const migratedCostIds = new Set(costRows.map((c) => c.id))
  const priceChangeRows = localPriceChanges
    .filter((pc) => migratedCostIds.has(pc.costId))
    .map((pc) => ({
      cost_id: pc.costId,
      old_amount: pc.oldAmount,
      new_amount: pc.newAmount,
      changed_at: pc.changedAt,
    }))

  if (priceChangeRows.length > 0) {
    await supabase.from('price_changes').insert(priceChangeRows)
  }

  dismissMigration()
  useRefreshBus.getState().bump()
}

import { useUserId } from '@/features/auth/authStore'
import { categoryFromRow, costFromRow, costToRow, priceChangeFromRow } from '@/lib/mappers'
import { useRefreshBus } from '@/lib/refreshBus'
import { supabase } from '@/lib/supabase'
import { useRealtimeQuery } from '@/lib/useSupabaseTable'
import type { Category, Cost, CostFormInput, CostStatus } from '@/types'

const bump = () => useRefreshBus.getState().bump()

/** Only the current user's own costs — household-shared costs live in useHouseholdCosts(). */
export function useCosts(): Cost[] {
  const userId = useUserId()
  return useRealtimeQuery(
    'costs',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .eq('user_id', userId)
        .order('next_payment', { ascending: true })
      if (error) throw error
      return (data ?? []).map(costFromRow)
    },
    [userId],
  )
}

export function useCategories(): Category[] {
  const userId = useUserId()
  return useRealtimeQuery(
    'categories',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId).order('name')
      if (error) throw error
      return (data ?? []).map(categoryFromRow)
    },
    [userId],
  )
}

export function usePriceChanges(costId: string) {
  return useRealtimeQuery(
    'price_changes',
    async () => {
      const { data, error } = await supabase
        .from('price_changes')
        .select('*')
        .eq('cost_id', costId)
        .order('changed_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(priceChangeFromRow)
    },
    [costId],
  )
}

export async function createCost(input: CostFormInput) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const row = costToRow({ ...input, userId })
  const { error } = await supabase.from('costs').insert(row)
  if (error) throw error
  bump()
}

export async function updateCost(id: string, input: CostFormInput) {
  const { data: existingRow, error: fetchError } = await supabase.from('costs').select('amount').eq('id', id).single()
  if (fetchError) throw fetchError

  const row = costToRow(input)
  const { error } = await supabase.from('costs').update(row).eq('id', id)
  if (error) throw error

  if (Number(existingRow.amount) !== input.amount) {
    await supabase.from('price_changes').insert({
      cost_id: id,
      old_amount: existingRow.amount,
      new_amount: input.amount,
    })
  }
  bump()
}

export async function deleteCost(id: string): Promise<Cost | undefined> {
  const { data: existing } = await supabase.from('costs').select('*').eq('id', id).single()
  const { error } = await supabase.from('costs').delete().eq('id', id)
  if (error) throw error
  bump()
  return existing ? costFromRow(existing) : undefined
}

export async function restoreCost(cost: Cost) {
  const row = costToRow(cost)
  row.id = cost.id
  await supabase.from('costs').insert(row)
  bump()
}

export async function setCostStatus(id: string, status: CostStatus) {
  const { error } = await supabase.from('costs').update({ status }).eq('id', id)
  if (error) throw error
  bump()
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  const { error } = await supabase.from('costs').update({ is_favorite: isFavorite }).eq('id', id)
  if (error) throw error
  bump()
}

export async function createCategory(input: Omit<Category, 'id' | 'isCustom'>) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const { error } = await supabase.from('categories').insert({
    user_id: userId,
    name: input.name,
    color: input.color,
    icon: input.icon,
    is_custom: true,
  })
  if (error) throw error
  bump()
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
  bump()
}

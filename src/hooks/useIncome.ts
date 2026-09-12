import { useUserId } from '@/features/auth/authStore'
import { incomeFromRow } from '@/lib/mappers'
import { useRefreshBus } from '@/lib/refreshBus'
import { supabase } from '@/lib/supabase'
import { useRealtimeQuery } from '@/lib/useSupabaseTable'
import type { IncomeFormInput } from '@/types'

const bump = () => useRefreshBus.getState().bump()

export function useIncome() {
  const userId = useUserId()
  return useRealtimeQuery(
    'income',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(incomeFromRow)
    },
    [userId],
  )
}

export async function createIncome(input: IncomeFormInput) {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('Not signed in')

  const { error } = await supabase.from('income').insert({
    user_id: userId,
    name: input.name,
    amount: input.amount,
    interval: input.interval,
    category: input.category,
  })
  if (error) throw error
  bump()
}

export async function deleteIncome(id: string) {
  const { error } = await supabase.from('income').delete().eq('id', id)
  if (error) throw error
  bump()
}

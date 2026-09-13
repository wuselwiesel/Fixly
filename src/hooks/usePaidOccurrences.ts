import { useMemo } from 'react'
import { useUserId } from '@/features/auth/authStore'
import { useRefreshBus } from '@/lib/refreshBus'
import { supabase } from '@/lib/supabase'
import { useRealtimeQuery } from '@/lib/useSupabaseTable'

interface PaidOccurrenceRow {
  costId: string
  dueDate: string
}

const bump = () => useRefreshBus.getState().bump()

function occurrenceKey(costId: string, dueDateIso: string) {
  return `${costId}_${dueDateIso}`
}

/** Set of "costId_dueDate" keys for occurrences the user has marked as paid. */
export function usePaidOccurrences(): Set<string> {
  const userId = useUserId()
  const rows = useRealtimeQuery<PaidOccurrenceRow>(
    'payment_occurrences',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase.from('payment_occurrences').select('cost_id, due_date')
      if (error) throw error
      return (data ?? []).map((r) => ({ costId: r.cost_id, dueDate: r.due_date }))
    },
    [userId],
  )
  return useMemo(() => new Set(rows.map((r) => occurrenceKey(r.costId, r.dueDate))), [rows])
}

export async function togglePaidOccurrence(costId: string, dueDateIso: string, currentlyPaid: boolean) {
  if (currentlyPaid) {
    const { error } = await supabase
      .from('payment_occurrences')
      .delete()
      .eq('cost_id', costId)
      .eq('due_date', dueDateIso)
    if (error) throw error
  } else {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) throw new Error('Not signed in')
    const { error } = await supabase
      .from('payment_occurrences')
      .insert({ cost_id: costId, due_date: dueDateIso, paid_by: userId })
    if (error) throw error
  }
  bump()
}

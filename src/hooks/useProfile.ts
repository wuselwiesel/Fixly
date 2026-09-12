import { useUserId } from '@/features/auth/authStore'
import { profileFromRow } from '@/lib/mappers'
import { useRefreshBus } from '@/lib/refreshBus'
import { supabase } from '@/lib/supabase'
import { useRealtimeQuery } from '@/lib/useSupabaseTable'
import type { Profile } from '@/types'

export function useProfile(): Profile | null {
  const userId = useUserId()
  const rows = useRealtimeQuery<Profile>(
    'profiles',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return [profileFromRow(data)]
    },
    [userId],
  )
  return rows[0] ?? null
}

export async function setPersonalSharing(userId: string, enabled: boolean) {
  const { error } = await supabase.from('profiles').update({ personal_sharing_enabled: enabled }).eq('id', userId)
  if (error) throw error
  useRefreshBus.getState().bump()
}

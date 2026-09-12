import { useUserId } from '@/features/auth/authStore'
import { costFromRow, householdFromRow, householdInviteFromRow, householdMemberFromRow } from '@/lib/mappers'
import { useRefreshBus } from '@/lib/refreshBus'
import { supabase } from '@/lib/supabase'
import { useRealtimeQuery } from '@/lib/useSupabaseTable'
import type { Cost, Household, HouseholdInvite, HouseholdMember } from '@/types'

const bump = () => useRefreshBus.getState().bump()

/** v1 assumes a single household per user; the schema supports more. */
export function useHousehold(): { household: Household | null; members: HouseholdMember[]; myRole: 'owner' | 'member' | null } {
  const userId = useUserId()

  const memberships = useRealtimeQuery<{ household_id: string; role: 'owner' | 'member' }>(
    'household_members',
    async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', userId)
      if (error) throw error
      return data ?? []
    },
    [userId],
  )

  const householdId = memberships[0]?.household_id
  const myRole = memberships[0]?.role ?? null

  const households = useRealtimeQuery<Household>(
    'households',
    async () => {
      if (!householdId) return []
      const { data, error } = await supabase.from('households').select('*').eq('id', householdId).maybeSingle()
      if (error || !data) return []
      return [householdFromRow(data)]
    },
    [householdId],
  )

  const members = useRealtimeQuery<HouseholdMember>(
    'household_members',
    async () => {
      if (!householdId) return []
      const { data, error } = await supabase
        .from('household_members')
        .select('*, profiles(*)')
        .eq('household_id', householdId)
      if (error) throw error
      return (data ?? []).map(householdMemberFromRow)
    },
    [householdId],
  )

  return { household: households[0] ?? null, members, myRole }
}

export function useHouseholdCosts(householdId: string | undefined, memberIds: string[]): Cost[] {
  const key = memberIds.slice().sort().join(',')
  return useRealtimeQuery<Cost>(
    'costs',
    async () => {
      if (!householdId || memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .in('user_id', memberIds)
        .neq('status', 'archived')
      if (error) throw error
      return (data ?? []).map(costFromRow)
    },
    [householdId, key],
  )
}

export async function createHousehold(name: string): Promise<Household> {
  const { data, error } = await supabase.rpc('create_household', { p_name: name })
  if (error) throw error
  bump()
  return householdFromRow(data)
}

export async function renameHousehold(householdId: string, name: string) {
  const { error } = await supabase.from('households').update({ name }).eq('id', householdId)
  if (error) throw error
  bump()
}

export async function deleteHousehold(householdId: string) {
  const { error } = await supabase.from('households').delete().eq('id', householdId)
  if (error) throw error
  bump()
}

export async function createInvite(householdId: string): Promise<HouseholdInvite> {
  const { data, error } = await supabase.rpc('create_invite', { p_household_id: householdId })
  if (error) throw error
  bump()
  return householdInviteFromRow(data)
}

export async function redeemInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_invite', { p_code: code })
  if (error) throw error
  bump()
  return data as string
}

export async function removeMember(householdId: string, userId: string) {
  const { error } = await supabase.from('household_members').delete().eq('household_id', householdId).eq('user_id', userId)
  if (error) throw error
  bump()
}

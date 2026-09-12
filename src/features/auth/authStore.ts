import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
}

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  loading: true,
}))

supabase.auth.getSession().then(({ data }) => {
  useAuthStore.setState({ session: data.session, loading: false })
})

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, loading: false })
})

export function useSession() {
  return useAuthStore((s) => s.session)
}

export function useUserId(): string | undefined {
  return useAuthStore((s) => s.session?.user.id)
}

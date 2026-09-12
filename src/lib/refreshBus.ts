import { create } from 'zustand'

/**
 * Realtime (postgres_changes) isn't always reliable in every environment.
 * Mutations bump this version so all useRealtimeQuery hooks refetch immediately,
 * independent of whether the realtime websocket connected.
 */
export const useRefreshBus = create<{ version: number; bump: () => void }>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}))

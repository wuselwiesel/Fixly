import { create } from 'zustand'
import type { Cost } from '@/types'

interface CostFormState {
  open: boolean
  editing: Cost | null
  openCreate: () => void
  openEdit: (cost: Cost) => void
  close: () => void
}

export const useCostFormStore = create<CostFormState>((set) => ({
  open: false,
  editing: null,
  openCreate: () => set({ open: true, editing: null }),
  openEdit: (cost) => set({ open: true, editing: cost }),
  close: () => set({ open: false, editing: null }),
}))

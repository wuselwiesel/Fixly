export type CostInterval =
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'yearly'
  | 'custom'

export type CostType = 'subscription' | 'contract' | 'fixed' | 'other'

export type CostStatus = 'active' | 'paused' | 'archived'

export type CostScope = 'personal' | 'household'

export type SplitType = 'equal' | 'percentage' | 'amount'

export interface CostSplit {
  type: SplitType
  /** userId -> percentage (0-100) or fixed amount, depending on type. Omitted/ignored for 'equal'. */
  shares?: Record<string, number>
}

export interface Cost {
  id: string
  userId: string
  householdId?: string | null
  scope: CostScope
  name: string
  description?: string
  categoryId: string
  type: CostType
  amount: number
  interval: CostInterval
  /** only used when interval === 'custom' */
  customIntervalDays?: number
  nextPayment: string
  paymentMethod?: string
  provider?: string
  website?: string
  contractStart?: string
  contractEnd?: string
  /** cancellation notice period, in days */
  cancellationPeriodDays?: number
  autoRenew?: boolean
  status: CostStatus
  notes?: string
  isFavorite?: boolean
  split?: CostSplit | null
  createdAt: string
  updatedAt: string
}

export interface PriceChange {
  id: string
  costId: string
  oldAmount: number
  newAmount: number
  changedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  isCustom: boolean
  sortOrder: number
}

export type IncomeInterval = 'monthly' | 'yearly' | 'once'
export type IncomeCategory = 'gehalt' | 'nebeneinkommen' | 'kindergeld' | 'kapitalertraege' | 'sonstiges'

export interface Income {
  id: string
  userId: string
  name: string
  amount: number
  interval: IncomeInterval
  category: IncomeCategory
  createdAt: string
}

export interface IncomeFormInput {
  name: string
  amount: number
  interval: IncomeInterval
  category: IncomeCategory
}

export interface CostFormInput {
  name: string
  description?: string
  categoryId: string
  type: CostType
  amount: number
  interval: CostInterval
  customIntervalDays?: number
  nextPayment: string
  paymentMethod?: string
  provider?: string
  website?: string
  contractStart?: string
  contractEnd?: string
  cancellationPeriodDays?: number
  autoRenew?: boolean
  status: CostStatus
  notes?: string
  scope: CostScope
  householdId?: string | null
  split?: CostSplit | null
}

export interface Profile {
  id: string
  email: string
  displayName: string | null
  personalSharingEnabled: boolean
  createdAt: string
}

export type HouseholdRole = 'owner' | 'member'

export interface Household {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export interface HouseholdMember {
  householdId: string
  userId: string
  role: HouseholdRole
  joinedAt: string
  profile: Profile
}

export interface HouseholdInvite {
  id: string
  householdId: string
  code: string
  createdBy: string
  expiresAt: string
  usedBy: string | null
  usedAt: string | null
  createdAt: string
}

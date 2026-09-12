import { Baby, Briefcase, MoreHorizontal, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import type { IncomeCategory, IncomeInterval } from '@/types'

export const INCOME_INTERVAL_LABELS: Record<IncomeInterval, string> = {
  monthly: 'monatlich',
  yearly: 'jährlich',
  once: 'einmalig',
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'gehalt',
  'nebeneinkommen',
  'kindergeld',
  'kapitalertraege',
  'sonstiges',
]

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  gehalt: 'Gehalt',
  nebeneinkommen: 'Nebeneinkommen',
  kindergeld: 'Kindergeld / Unterhalt',
  kapitalertraege: 'Kapitalerträge',
  sonstiges: 'Sonstiges',
}

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, LucideIcon> = {
  gehalt: Briefcase,
  nebeneinkommen: Wallet,
  kindergeld: Baby,
  kapitalertraege: TrendingUp,
  sonstiges: MoreHorizontal,
}

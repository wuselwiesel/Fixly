import Dexie, { type EntityTable } from 'dexie'
import type { Category, Cost, Income, PriceChange } from '@/types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'wohnen', name: 'Wohnen', color: 'var(--color-chart-1)', icon: 'Home', isCustom: false },
  { id: 'energie', name: 'Energie', color: 'var(--color-chart-4)', icon: 'Zap', isCustom: false },
  { id: 'versicherungen', name: 'Versicherungen', color: 'var(--color-chart-2)', icon: 'ShieldCheck', isCustom: false },
  { id: 'mobilitaet', name: 'Mobilität', color: 'var(--color-chart-5)', icon: 'Car', isCustom: false },
  { id: 'kommunikation', name: 'Kommunikation', color: 'var(--color-chart-3)', icon: 'Smartphone', isCustom: false },
  { id: 'streaming', name: 'Streaming & Unterhaltung', color: 'var(--color-chart-6)', icon: 'Clapperboard', isCustom: false },
  { id: 'software', name: 'Software & Apps', color: 'var(--color-chart-1)', icon: 'AppWindow', isCustom: false },
  { id: 'mitgliedschaften', name: 'Mitgliedschaften', color: 'var(--color-chart-2)', icon: 'Users', isCustom: false },
  { id: 'finanzen', name: 'Finanzen', color: 'var(--color-chart-4)', icon: 'Landmark', isCustom: false },
  { id: 'familie', name: 'Familie', color: 'var(--color-chart-3)', icon: 'Heart', isCustom: false },
  { id: 'haustiere', name: 'Haustiere', color: 'var(--color-chart-5)', icon: 'PawPrint', isCustom: false },
  { id: 'gesundheit', name: 'Gesundheit', color: 'var(--color-chart-6)', icon: 'Stethoscope', isCustom: false },
  { id: 'sonstiges', name: 'Sonstiges', color: 'var(--color-chart-2)', icon: 'MoreHorizontal', isCustom: false },
]

class FixlyDatabase extends Dexie {
  costs!: EntityTable<Cost, 'id'>
  categories!: EntityTable<Category, 'id'>
  priceChanges!: EntityTable<PriceChange, 'id'>
  income!: EntityTable<Income, 'id'>

  constructor() {
    super('fixly')
    this.version(1).stores({
      costs: 'id, categoryId, type, status, interval, nextPayment',
      categories: 'id, isCustom',
      priceChanges: 'id, costId, changedAt',
      income: 'id',
    })
    this.on('populate', () => {
      this.categories.bulkAdd(DEFAULT_CATEGORIES)
    })
  }
}

export const db = new FixlyDatabase()

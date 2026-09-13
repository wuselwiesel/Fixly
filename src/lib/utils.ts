import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(d)
}

export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Parses a locale-flexible decimal string (accepts "," or "." as the separator,
 * as typed on a German keyboard) into a number. Returns 0 for empty/invalid input.
 */
export function parseDecimalInput(value: string): number {
  const normalized = value.replace(',', '.').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

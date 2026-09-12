import { Pipette } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Theme-aware presets: these track the active color palette and dark/light mode. */
export const THEME_COLOR_PRESETS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
]

/** Fixed presets for when a category should keep the same color regardless of theme. */
export const FIXED_COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#64748b',
  '#0f172a',
]

const ALL_PRESETS = [...THEME_COLOR_PRESETS, ...FIXED_COLOR_PRESETS]

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const isCustom = !ALL_PRESETS.includes(value)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ALL_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="size-7 shrink-0 rounded-full transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            outline: value === color ? `2px solid ${color}` : 'none',
            outlineOffset: 2,
          }}
          aria-label={color}
        />
      ))}
      <label
        className={cn(
          'relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground transition-transform hover:scale-110',
          isCustom && 'border-solid',
        )}
        style={isCustom ? { backgroundColor: value, outline: `2px solid ${value}`, outlineOffset: 2 } : undefined}
        aria-label="Eigene Farbe wählen"
        title="Eigene Farbe wählen"
      >
        {!isCustom && <Pipette className="size-3.5" />}
        <input
          type="color"
          value={isCustom ? value : '#7c86ff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}

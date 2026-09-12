import { ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORY_ICON_NAMES, CATEGORY_ICONS } from '@/lib/categoryIcons'
import { cn } from '@/lib/utils'

export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string
  onChange: (icon: string) => void
  color: string
}) {
  const SelectedIcon = CATEGORY_ICONS[value] ?? CATEGORY_ICONS.MoreHorizontal

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:bg-muted"
        >
          <span
            className="flex size-5 items-center justify-center rounded-md"
            style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
          >
            <SelectedIcon className="size-3.5" />
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto">
          {CATEGORY_ICON_NAMES.map((name) => {
            const Icon = CATEGORY_ICONS[name]
            const selected = name === value
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                aria-label={name}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted',
                  selected && 'bg-muted ring-2 ring-ring',
                )}
                style={selected ? { color } : undefined}
              >
                <Icon className="size-4.5" />
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

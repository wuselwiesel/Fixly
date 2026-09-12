import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORY_ICON_NAMES, CATEGORY_ICONS } from '@/lib/categoryIcons'
import { ICON_KEYWORDS } from '@/lib/iconKeywords'
import { cn } from '@/lib/utils'

function splitPascalCase(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
}

function matchesQuery(name: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (splitPascalCase(name).includes(q)) return true
  return (ICON_KEYWORDS[name] ?? '').includes(q)
}

export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string
  onChange: (icon: string) => void
  color: string
}) {
  const [query, setQuery] = useState('')
  const SelectedIcon = CATEGORY_ICONS[value] ?? CATEGORY_ICONS.MoreHorizontal
  const visibleNames = useMemo(
    () => CATEGORY_ICON_NAMES.filter((name) => matchesQuery(name, query)),
    [query],
  )

  return (
    <Popover onOpenChange={(open) => !open && setQuery('')}>
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
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Icon suchen…"
            autoFocus
            className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto">
          {visibleNames.map((name) => {
            const Icon = CATEGORY_ICONS[name]
            const selected = name === value
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                aria-label={name}
                title={name}
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
          {visibleNames.length === 0 && (
            <p className="col-span-6 py-6 text-center text-sm text-muted-foreground">Kein Icon gefunden.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

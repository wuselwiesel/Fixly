import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useHousehold } from '@/features/household/useHousehold'
import { useCategories, createCost, updateCost } from '@/hooks/useCosts'
import { INTERVAL_LABELS } from '@/lib/calculations'
import { SPLIT_TYPE_LABELS } from '@/lib/split'
import { useCostFormStore } from '@/store/costFormStore'
import type { CostFormInput, CostInterval, CostScope, CostType, SplitType } from '@/types'

const TYPE_LABELS: Record<CostType, string> = {
  fixed: 'Fixkosten',
  subscription: 'Abo',
  contract: 'Vertrag',
  other: 'Sonstiges',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(categoryId: string): CostFormInput {
  return {
    name: '',
    categoryId,
    type: 'fixed',
    amount: 0,
    interval: 'monthly',
    nextPayment: todayIso(),
    status: 'active',
    autoRenew: false,
    scope: 'personal',
  }
}

export function CostFormSheet() {
  const { open, editing, close } = useCostFormStore()
  const categories = useCategories()
  const { household, members } = useHousehold()
  const [form, setForm] = useState<CostFormInput>(emptyForm(''))
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      const { id, userId, createdAt, updatedAt, isFavorite, ...rest } = editing
      setForm(rest)
      setShowDetails(Boolean(editing.contractEnd || editing.provider || editing.notes))
    } else {
      setForm(emptyForm(categories[0]?.id ?? ''))
      setShowDetails(false)
    }
    setError(null)
  }, [open, editing, categories])

  function set<K extends keyof CostFormInput>(key: K, value: CostFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) return setError('Bitte gib einen Namen ein.')
    if (!form.categoryId) return setError('Bitte wähle eine Kategorie.')
    if (!(form.amount > 0)) return setError('Bitte gib einen Betrag größer 0 ein.')
    if (!form.nextPayment) return setError('Bitte gib das nächste Zahlungsdatum an.')

    if (editing) {
      await updateCost(editing.id, form)
    } else {
      await createCost(form)
    }
    close()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? 'Kosten bearbeiten' : 'Kosten hinzufügen'}</SheetTitle>
          <SheetDescription>
            {editing ? 'Passe die Details dieser Kostenposition an.' : 'Erfasse eine neue regelmäßige Ausgabe.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="z. B. Netflix, Miete, Handyvertrag"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.amount || ''}
                onChange={(e) => set('amount', Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Intervall</Label>
              <Select value={form.interval} onValueChange={(v) => set('interval', v as CostInterval)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERVAL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.interval === 'custom' && (
            <div className="flex flex-col gap-1.5">
              <Label>Alle wie viele Tage?</Label>
              <Input
                type="number"
                min="1"
                value={form.customIntervalDays ?? ''}
                onChange={(e) => set('customIntervalDays', Number(e.target.value))}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Kategorie</Label>
            <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Typ</Label>
            <Tabs value={form.type} onValueChange={(v) => set('type', v as CostType)}>
              <TabsList className="w-full">
                {(Object.keys(TYPE_LABELS) as CostType[]).map((t) => (
                  <TabsTrigger key={t} value={t} className="flex-1">
                    {TYPE_LABELS[t]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {household && (
            <div className="flex flex-col gap-1.5">
              <Label>Art der Kosten</Label>
              <Tabs
                value={form.scope}
                onValueChange={(v) => {
                  const scope = v as CostScope
                  setForm((f) => ({
                    ...f,
                    scope,
                    householdId: scope === 'household' ? household.id : null,
                    split: scope === 'household' ? (f.split ?? { type: 'equal' }) : null,
                  }))
                }}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="personal" className="flex-1">
                    Persönlich
                  </TabsTrigger>
                  <TabsTrigger value="household" className="flex-1">
                    Haushalt
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {household && form.scope === 'household' && (
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
              <div className="flex flex-col gap-1.5">
                <Label>Aufteilung</Label>
                <Select
                  value={form.split?.type ?? 'equal'}
                  onValueChange={(v) => set('split', { type: v as SplitType, shares: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPLIT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.split && form.split.type !== 'equal' && (
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{m.profile.displayName ?? m.profile.email}</span>
                      <Input
                        type="number"
                        min="0"
                        step={form.split?.type === 'percentage' ? '1' : '0.01'}
                        className="w-28"
                        value={form.split?.shares?.[m.userId] ?? ''}
                        onChange={(e) =>
                          set('split', {
                            type: form.split!.type,
                            shares: { ...form.split?.shares, [m.userId]: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Nächste Zahlung</Label>
            <Input type="date" value={form.nextPayment} onChange={(e) => set('nextPayment', e.target.value)} />
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            {showDetails ? 'Weniger Details' : 'Mehr Details (Vertrag, Anbieter, Notizen)'}
          </button>

          {showDetails && (
            <div className="flex flex-col gap-4 rounded-2xl bg-muted/60 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Anbieter</Label>
                  <Input value={form.provider ?? ''} onChange={(e) => set('provider', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Zahlungsart</Label>
                  <Input value={form.paymentMethod ?? ''} onChange={(e) => set('paymentMethod', e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Website des Anbieters</Label>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={form.website ?? ''}
                  onChange={(e) => set('website', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Vertragsbeginn</Label>
                  <Input type="date" value={form.contractStart ?? ''} onChange={(e) => set('contractStart', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Vertragsende</Label>
                  <Input type="date" value={form.contractEnd ?? ''} onChange={(e) => set('contractEnd', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Kündigungsfrist (Tage)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.cancellationPeriodDays ?? ''}
                    onChange={(e) => set('cancellationPeriodDays', Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-input px-3 py-2">
                  <Label htmlFor="autoRenew" className="text-sm">
                    Verlängert sich automatisch
                  </Label>
                  <Switch id="autoRenew" checked={Boolean(form.autoRenew)} onCheckedChange={(v) => set('autoRenew', v)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Notiz</Label>
                <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={close}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit}>{editing ? 'Speichern' : 'Hinzufügen'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

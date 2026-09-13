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
import { useUserId } from '@/features/auth/authStore'
import { useHousehold } from '@/features/household/useHousehold'
import { useCategories, createCost, updateCost } from '@/hooks/useCosts'
import { INTERVAL_LABELS } from '@/lib/calculations'
import { SPLIT_TYPE_LABELS } from '@/lib/split'
import { formatCurrency, parseDecimalInput } from '@/lib/utils'
import { useCostFormStore } from '@/store/costFormStore'
import type { CostFormInput, CostInterval, CostScope, CostType, SplitType } from '@/types'

type AmountMode = 'total' | 'share'

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
  const myId = useUserId()
  const [form, setForm] = useState<CostFormInput>(emptyForm(''))
  const [amountText, setAmountText] = useState('')
  const [amountMode, setAmountMode] = useState<AmountMode>('total')
  const [shareTexts, setShareTexts] = useState<Record<string, string>>({})
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /** Fraction of the total that "my" share represents, for the current split settings. */
  function myShareFraction(split: CostFormInput['split']): number | null {
    if (!split || split.type === 'equal') {
      return members.length > 0 ? 1 / members.length : null
    }
    if (split.type === 'percentage') {
      const pct = myId ? split.shares?.[myId] : undefined
      return pct && pct > 0 ? pct / 100 : null
    }
    return null
  }

  useEffect(() => {
    if (!open) return
    if (editing) {
      const { id, userId, createdAt, updatedAt, isFavorite, ...rest } = editing
      setForm(rest)
      setAmountText(rest.amount ? String(rest.amount).replace('.', ',') : '')
      setShareTexts(
        Object.fromEntries(
          Object.entries(rest.split?.shares ?? {}).map(([userId, v]) => [userId, String(v).replace('.', ',')]),
        ),
      )
      setShowDetails(Boolean(editing.contractEnd || editing.provider || editing.notes))
    } else {
      setForm(emptyForm(categories[0]?.id ?? ''))
      setAmountText('')
      setShareTexts({})
      setShowDetails(false)
    }
    setAmountMode('total')
    setError(null)
    setSubmitting(false)
  }, [open, editing, categories])

  function set<K extends keyof CostFormInput>(key: K, value: CostFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleAmountChange(raw: string) {
    setAmountText(raw)
    set('amount', parseDecimalInput(raw))
  }

  function handleAmountModeChange(mode: AmountMode) {
    if (mode === amountMode) return
    const fraction = myShareFraction(form.split)
    if (fraction) {
      const current = parseDecimalInput(amountText)
      const converted = mode === 'share' ? current * fraction : current / fraction
      setAmountText(converted ? String(Number(converted.toFixed(2))).replace('.', ',') : '')
      set('amount', converted)
    }
    setAmountMode(mode)
  }

  function handleShareChange(userId: string, raw: string) {
    setShareTexts((t) => ({ ...t, [userId]: raw }))
    set('split', {
      type: form.split!.type,
      shares: { ...form.split?.shares, [userId]: parseDecimalInput(raw) },
    })
  }

  async function handleSubmit() {
    if (submitting) return
    if (!form.name.trim()) return setError('Bitte gib einen Namen ein.')
    if (!form.categoryId) return setError('Bitte wähle eine Kategorie.')
    if (!(form.amount > 0)) return setError('Bitte gib einen Betrag größer 0 ein.')
    if (!form.nextPayment) return setError('Bitte gib das nächste Zahlungsdatum an.')

    let payload = form
    if (form.scope === 'household' && amountMode === 'share') {
      const fraction = myShareFraction(form.split)
      if (!fraction) {
        return setError('Bitte gib deinen Prozentanteil an, damit der Gesamtbetrag berechnet werden kann.')
      }
      payload = { ...form, amount: form.amount / fraction }
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateCost(editing.id, payload)
      } else {
        await createCost(payload)
      }
      close()
    } catch {
      setError('Speichern fehlgeschlagen. Bitte versuch es erneut.')
      setSubmitting(false)
    }
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
              <Label>{amountMode === 'share' ? 'Mein Anteil (€)' : 'Betrag (€)'}</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountText}
                onChange={(e) => handleAmountChange(e.target.value)}
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
                  onValueChange={(v) => {
                    setShareTexts({})
                    if (v === 'amount') setAmountMode('total')
                    set('split', { type: v as SplitType, shares: {} })
                  }}
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

              {form.split?.type !== 'amount' && (
                <div className="flex flex-col gap-1.5">
                  <Label>Betrag ist</Label>
                  <Tabs value={amountMode} onValueChange={(v) => handleAmountModeChange(v as AmountMode)}>
                    <TabsList className="w-full">
                      <TabsTrigger value="total" className="flex-1">
                        Gesamtbetrag
                      </TabsTrigger>
                      <TabsTrigger value="share" className="flex-1">
                        Mein Anteil
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {amountMode === 'share' &&
                    (() => {
                      const fraction = myShareFraction(form.split)
                      return fraction ? (
                        <p className="text-xs text-muted-foreground">
                          Gesamtbetrag: {formatCurrency(form.amount / fraction)}
                        </p>
                      ) : (
                        <p className="text-xs text-warning-foreground">
                          Gib unten deinen Prozentanteil an, um den Gesamtbetrag zu berechnen.
                        </p>
                      )
                    })()}
                </div>
              )}

              {form.split && form.split.type !== 'equal' && (
                <div className="flex flex-col gap-2">
                  {members.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{m.profile.displayName ?? m.profile.email}</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="w-28"
                        value={shareTexts[m.userId] ?? ''}
                        onChange={(e) => handleShareChange(m.userId, e.target.value)}
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
          <Button variant="outline" onClick={close} disabled={submitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Wird gespeichert…' : editing ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import { Check, ChevronDown, ChevronUp, Download, KeyRound, LogOut, Moon, Pencil, Plus, Sun, Trash2, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ColorPicker, THEME_COLOR_PRESETS } from '@/components/ColorPicker'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { IconPicker } from '@/components/IconPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUserId } from '@/features/auth/authStore'
import { createCategory, deleteCategory, swapCategoryOrder, updateCategory, useCategories, useCosts } from '@/hooks/useCosts'
import { setPersonalSharing, useProfile } from '@/hooks/useProfile'
import { COLOR_PALETTES } from '@/lib/palettes'
import { supabase } from '@/lib/supabase'
import { useColorPaletteStore } from '@/store/colorPalette'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { palette, setPalette } = useColorPaletteStore()
  const userId = useUserId()
  const profile = useProfile()
  const categories = useCategories()
  const costs = useCosts()
  const costCountByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const cost of costs) map.set(cost.categoryId, (map.get(cost.categoryId) ?? 0) + 1)
    return map
  }, [costs])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('MoreHorizontal')
  const [newCategoryColor, setNewCategoryColor] = useState(THEME_COLOR_PRESETS[0])
  const [resetOpen, setResetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('MoreHorizontal')
  const [editColor, setEditColor] = useState(THEME_COLOR_PRESETS[0])
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    await createCategory({ name: newCategoryName.trim(), icon: newCategoryIcon, color: newCategoryColor })
    setNewCategoryName('')
    toast('Kategorie hinzugefügt')
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    setEditName(category.name)
    setEditIcon(category.icon)
    setEditColor(category.color)
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return
    await updateCategory(editingId, { name: editName.trim(), icon: editIcon, color: editColor })
    setEditingId(null)
    toast('Kategorie aktualisiert')
  }

  async function handleMoveCategory(index: number, direction: -1 | 1) {
    const other = categories[index + direction]
    const current = categories[index]
    if (!other) return
    await swapCategoryOrder(current, other)
  }

  async function handleDeleteCategory(category: Category) {
    setDeleteTarget(null)
    try {
      await deleteCategory(category.id)
      toast('Kategorie gelöscht')
    } catch (err) {
      if (err instanceof Object && 'code' in err && err.code === '23503') {
        toast.error(`„${category.name}" wird noch von Kosten verwendet. Ordne diese zuerst einer anderen Kategorie zu.`)
        return
      }
      toast.error('Kategorie konnte nicht gelöscht werden.')
    }
  }

  async function handleExport() {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      categories,
      costs,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fixly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(file: File) {
    if (!userId) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]))

      if (Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          if (categoryIdByName.has(cat.name)) continue
          await createCategory({ name: cat.name, color: cat.color, icon: cat.icon })
        }
      }

      toast.success('Kategorien importiert – Kosten bitte einzeln über „Kosten hinzufügen" ergänzen')
    } catch {
      toast.error('Import fehlgeschlagen – ist die Datei ein gültiges Fixly-Backup?')
    }
  }

  async function handleChangePassword() {
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('Die Passwörter stimmen nicht überein.')
      return
    }
    setPasswordLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)
    if (error) {
      setPasswordError('Passwort konnte nicht geändert werden. Bitte versuch es erneut.')
      return
    }
    setNewPassword('')
    setNewPasswordConfirm('')
    toast.success('Passwort geändert')
  }

  async function handleReset() {
    if (!userId) return
    await supabase.from('costs').delete().eq('user_id', userId)
    toast('Alle Kosten wurden gelöscht')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">Kategorien, Freigaben, Darstellung und Datensicherung.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meine Kosten teilen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Haushaltskosten</span>
            <span className="text-sm font-medium">Werden immer mit deinem Haushalt geteilt</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Persönliche Kosten ebenfalls teilen</span>
              <span className="text-xs text-muted-foreground">
                {profile?.personalSharingEnabled
                  ? 'Dein Haushaltsmitglied sieht aktuell auch deine persönlichen Kosten.'
                  : 'Deine persönlichen Kosten werden aktuell nicht geteilt.'}
              </span>
            </div>
            <Switch
              checked={profile?.personalSharingEnabled ?? false}
              onCheckedChange={(v) => userId && setPersonalSharing(userId, v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Darstellung</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            Dark Mode
          </span>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farbschema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors',
                  palette.id === p.id ? 'border-primary ring-2 ring-ring' : 'border-border hover:bg-muted',
                )}
              >
                <div className="flex flex-wrap gap-1">
                  {p.swatches.map((color, i) => (
                    <span key={i} className="size-4 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-sm font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kategorien</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {categories.map((c, index) =>
              editingId === c.id ? (
                <li key={c.id} className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-3">
                  <div className="flex items-center gap-2">
                    <IconPicker value={editIcon} onChange={setEditIcon} color={editColor} />
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" autoFocus />
                    <Button size="icon" onClick={handleSaveEdit} aria-label="Speichern">
                      <Check className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} aria-label="Abbrechen">
                      <X className="size-4" />
                    </Button>
                  </div>
                  <ColorPicker value={editColor} onChange={setEditColor} />
                </li>
              ) : (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(index, -1)}
                        disabled={index === 0}
                        aria-label="Nach oben verschieben"
                        className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCategory(index, 1)}
                        disabled={index === categories.length - 1}
                        aria-label="Nach unten verschieben"
                        className="text-muted-foreground disabled:opacity-20 hover:text-foreground"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </div>
                    <span className="flex min-w-0 items-center gap-2.5 text-sm">
                      <CategoryIcon icon={c.icon} color={c.color} className="size-7" />
                      <span className="truncate">{c.name}</span>
                      {(costCountByCategory.get(c.id) ?? 0) > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          · {costCountByCategory.get(c.id)} {costCountByCategory.get(c.id) === 1 ? 'Kosten-Position' : 'Kosten-Positionen'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)} aria-label="Bearbeiten">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)} aria-label="Löschen">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>

          <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label>Neue Kategorie</Label>
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="z. B. Hobbys" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Icon</Label>
                <IconPicker value={newCategoryIcon} onChange={setNewCategoryIcon} color={newCategoryColor} />
              </div>
              <Button onClick={handleAddCategory} size="icon" aria-label="Hinzufügen">
                <Plus className="size-4" />
              </Button>
            </div>
            <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`„${deleteTarget?.name}" löschen?`}
        description={
          deleteTarget && (costCountByCategory.get(deleteTarget.id) ?? 0) > 0
            ? `Dieser Kategorie sind noch ${costCountByCategory.get(deleteTarget.id)} Kosten zugeordnet. Ordne diese zuerst einer anderen Kategorie zu, bevor du sie löschst.`
            : 'Diese Kategorie wird endgültig entfernt.'
        }
        confirmLabel="Löschen"
        confirmDisabled={Boolean(deleteTarget && (costCountByCategory.get(deleteTarget.id) ?? 0) > 0)}
        onConfirm={() => deleteTarget && handleDeleteCategory(deleteTarget)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Daten sichern</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="size-4" />
            Exportieren ({costs.length} Kosten)
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="size-4" />
            Kategorien importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4" />
              Passwort ändern
            </Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="newPassword" className="text-xs text-muted-foreground">
                  Neues Passwort
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="newPasswordConfirm" className="text-xs text-muted-foreground">
                  Bestätigen
                </Label>
                <Input
                  id="newPasswordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <Button onClick={handleChangePassword} disabled={passwordLoading} className="gap-2">
                {passwordLoading ? 'Wird geändert…' : 'Ändern'}
              </Button>
            </div>
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>

          <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-fit gap-2">
            <LogOut className="size-4" />
            Abmelden
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setResetOpen(true)}>
            Alle Kosten löschen
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Wirklich alle Kosten löschen?"
        description="Alle deine Kosten und Preis-Historien werden unwiderruflich gelöscht. Exportiere vorher ein Backup, falls du die Daten behalten möchtest."
        confirmLabel="Löschen"
        onConfirm={handleReset}
      />
    </div>
  )
}

import { Download, LogOut, Moon, Plus, Sun, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CategoryIcon } from '@/components/CategoryIcon'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useUserId } from '@/features/auth/authStore'
import { createCategory, deleteCategory, useCategories, useCosts } from '@/hooks/useCosts'
import { setPersonalSharing, useProfile } from '@/hooks/useProfile'
import { COLOR_PALETTES } from '@/lib/palettes'
import { supabase } from '@/lib/supabase'
import { useColorPaletteStore } from '@/store/colorPalette'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'

const ICON_OPTIONS = [
  'Home',
  'Zap',
  'ShieldCheck',
  'Car',
  'Smartphone',
  'Clapperboard',
  'AppWindow',
  'Users',
  'Landmark',
  'Heart',
  'PawPrint',
  'Stethoscope',
  'MoreHorizontal',
]

const COLOR_OPTIONS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
]

export function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { palette, setPalette } = useColorPaletteStore()
  const userId = useUserId()
  const profile = useProfile()
  const categories = useCategories()
  const costs = useCosts()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('MoreHorizontal')
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0])
  const [resetOpen, setResetOpen] = useState(false)

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    await createCategory({ name: newCategoryName.trim(), icon: newCategoryIcon, color: newCategoryColor })
    setNewCategoryName('')
    toast('Kategorie hinzugefügt')
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
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2.5 text-sm">
                  <CategoryIcon icon={c.icon} color={c.color} className="size-7" />
                  {c.name}
                </span>
                {c.isCustom && (
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)} aria-label="Löschen">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Neue Kategorie</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="z. B. Hobbys" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategoryColor(color)}
                  className="size-8 rounded-full ring-offset-2 transition-all"
                  style={{ backgroundColor: color, outline: newCategoryColor === color ? `2px solid ${color}` : 'none', outlineOffset: 2 }}
                  aria-label={color}
                />
              ))}
            </div>
            <Button onClick={handleAddCategory} size="icon" aria-label="Hinzufügen">
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <CardContent>
          <Button variant="outline" onClick={() => supabase.auth.signOut()} className="gap-2">
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

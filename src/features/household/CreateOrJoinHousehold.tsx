import { Home, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createHousehold, redeemInvite } from './useHousehold'

export function CreateOrJoinHousehold() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      await createHousehold(name.trim())
      toast.success('Haushalt erstellt')
    } catch {
      toast.error('Haushalt konnte nicht erstellt werden')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin() {
    if (!code.trim()) return
    setJoining(true)
    try {
      await redeemInvite(code.trim())
      toast.success('Haushalt beigetreten')
    } catch {
      toast.error('Ungültiger oder abgelaufener Code')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Haushalt</h1>
        <p className="text-sm text-muted-foreground">
          Teile Haushaltskosten mit einer anderen Person – deine persönlichen Kosten bleiben standardmäßig privat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Home className="size-4" /> Haushalt erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Haushaltsname</Label>
              <Input placeholder="z. B. Unsere Wohnung" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={handleCreate} disabled={creating}>
              Erstellen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <KeyRound className="size-4" /> Haushalt beitreten
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Einladungscode</Label>
              <Input
                placeholder="z. B. A1B2C3D4"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button onClick={handleJoin} disabled={joining} variant="outline">
              Beitreten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

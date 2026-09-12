import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserId } from '@/features/auth/authStore'
import type { Household } from '@/types'
import { deleteHousehold, removeMember, renameHousehold } from './useHousehold'

export function HouseholdSettingsTab({ household, myRole }: { household: Household; myRole: 'owner' | 'member' | null }) {
  const myId = useUserId()
  const [name, setName] = useState(household.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  async function handleRename() {
    if (!name.trim() || name === household.name) return
    try {
      await renameHousehold(household.id, name.trim())
      toast.success('Name aktualisiert')
    } catch {
      toast.error('Konnte nicht gespeichert werden')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {myRole === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>Haushaltsname</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={handleRename}>Speichern</Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {myRole === 'owner' ? (
            <>
              <p className="text-sm text-muted-foreground">
                Löscht den Haushalt für alle Mitglieder unwiderruflich. Kosten bleiben als persönliche Kosten der
                jeweiligen Person erhalten.
              </p>
              <Button variant="destructive" className="self-start" onClick={() => setConfirmDelete(true)}>
                Haushalt löschen
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Du verlierst den Zugriff auf die gemeinsamen Haushaltskosten.</p>
              <Button variant="destructive" className="self-start" onClick={() => setConfirmLeave(true)}>
                Haushalt verlassen
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Haushalt wirklich löschen?"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={() => deleteHousehold(household.id)}
      />

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title="Haushalt verlassen?"
        description="Du kannst jederzeit über einen neuen Einladungscode wieder beitreten."
        confirmLabel="Verlassen"
        onConfirm={() => myId && removeMember(household.id, myId)}
      />
    </div>
  )
}

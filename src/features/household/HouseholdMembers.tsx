import { format } from 'date-fns'
import { Copy, UserMinus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserId } from '@/features/auth/authStore'
import type { HouseholdMember } from '@/types'
import { createInvite, removeMember } from './useHousehold'

export function HouseholdMembers({
  householdId,
  members,
  myRole,
}: {
  householdId: string
  members: HouseholdMember[]
  myRole: 'owner' | 'member' | null
}) {
  const myId = useUserId()
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<HouseholdMember | null>(null)

  async function handleInvite() {
    try {
      const inv = await createInvite(householdId)
      setInvite({ code: inv.code, expiresAt: inv.expiresAt })
    } catch {
      toast.error('Einladung konnte nicht erstellt werden')
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success('Code kopiert')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Mitglieder</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {m.profile.displayName ?? m.profile.email} {m.userId === myId && '(du)'}
                </span>
                <span className="text-xs text-muted-foreground">{m.profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.role === 'owner' ? 'default' : 'muted'}>
                  {m.role === 'owner' ? 'Inhaber' : 'Mitglied'}
                </Badge>
                {myRole === 'owner' && m.userId !== myId && (
                  <Button variant="ghost" size="icon" onClick={() => setPendingRemove(m)} aria-label="Entfernen">
                    <UserMinus className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {myRole === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>Person einladen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={handleInvite} className="self-start">
              Einladungscode erzeugen
            </Button>
            {invite && (
              <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                <div>
                  <div className="font-mono text-lg font-semibold tracking-wider">{invite.code}</div>
                  <div className="text-xs text-muted-foreground">
                    Gültig bis {format(new Date(invite.expiresAt), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={() => copyCode(invite.code)} aria-label="Kopieren">
                  <Copy className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => !o && setPendingRemove(null)}
        title="Mitglied entfernen?"
        description={`${pendingRemove?.profile.displayName ?? pendingRemove?.profile.email} verliert den Zugriff auf den Haushalt.`}
        confirmLabel="Entfernen"
        onConfirm={() => pendingRemove && removeMember(householdId, pendingRemove.userId)}
      />
    </div>
  )
}

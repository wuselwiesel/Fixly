import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { dismissMigration, hasLocalDataToOffer, migrateLocalData } from '@/lib/migrateLocalData'
import { useUserId } from './authStore'

export function MigrationPrompt() {
  const userId = useUserId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    hasLocalDataToOffer().then(setOpen)
  }, [userId])

  if (!userId) return null

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) dismissMigration()
        setOpen(o)
      }}
      title="Lokale Daten übernehmen?"
      description="Auf diesem Gerät wurden bereits Kosten lokal gespeichert. Sollen sie in dein Fixly-Konto übernommen werden?"
      confirmLabel="Übernehmen"
      destructive={false}
      onConfirm={async () => {
        try {
          await migrateLocalData(userId)
          toast.success('Lokale Daten wurden übernommen')
        } catch {
          toast.error('Import fehlgeschlagen')
        }
      }}
    />
  )
}

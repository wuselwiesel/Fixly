import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateOrJoinHousehold } from './CreateOrJoinHousehold'
import { HouseholdMembers } from './HouseholdMembers'
import { HouseholdOverview } from './HouseholdOverview'
import { HouseholdSettingsTab } from './HouseholdSettingsTab'
import { useHousehold } from './useHousehold'

export function HouseholdPage() {
  const { household, members, myRole } = useHousehold()

  if (!household) {
    return <CreateOrJoinHousehold />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{household.name}</h1>
        <p className="text-sm text-muted-foreground">Euer gemeinsamer Haushalt.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="members">Mitglieder</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <HouseholdOverview householdId={household.id} members={members} />
        </TabsContent>
        <TabsContent value="members">
          <HouseholdMembers householdId={household.id} members={members} myRole={myRole} />
        </TabsContent>
        <TabsContent value="settings">
          <HouseholdSettingsTab household={household} myRole={myRole} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

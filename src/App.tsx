import { Route, HashRouter, Routes } from 'react-router-dom'
import { Layout } from '@/app/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { MigrationPrompt } from '@/features/auth/MigrationPrompt'
import { useAuthStore } from '@/features/auth/authStore'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { CostsPage } from '@/features/costs/CostsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { HouseholdPage } from '@/features/household/HouseholdPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function App() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-background" />
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <HashRouter>
      <MigrationPrompt />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="kosten" element={<CostsPage />} />
          <Route path="kalender" element={<CalendarPage />} />
          <Route path="auswertungen" element={<AnalyticsPage />} />
          <Route path="haushalt" element={<HouseholdPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

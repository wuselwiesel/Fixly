import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CostFormSheet } from '@/features/costs/CostFormSheet'
import { BottomNav } from './BottomNav'
import { MobileFab } from './MobileFab'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <main className="pb-24 lg:ml-64 lg:pb-10">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <MobileFab />
      <CostFormSheet />
      <Toaster position="top-center" richColors />
    </div>
  )
}

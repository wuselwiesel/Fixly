import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CostFormSheet } from '@/features/costs/CostFormSheet'
import { BottomNav } from './BottomNav'
import { MobileFab } from './MobileFab'
import { MobileTopBar } from './MobileTopBar'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <MobileTopBar />
      <main className="pb-[calc(env(safe-area-inset-bottom,0px)+9rem)] lg:ml-64 lg:pb-10">
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

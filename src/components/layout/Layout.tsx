import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastStack } from '@/components/ui/Toast'
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal'

export const Layout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ToastStack />
    <LogoutConfirmModal />
  </div>
)

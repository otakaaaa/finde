import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { ToastStack } from '@/components/ui/Toast'
import { LogoutConfirmModal } from '@/components/auth/LogoutConfirmModal'
import { DeleteAccountModal } from '@/components/auth/DeleteAccountModal'
import { ReviewReportModal } from '@/components/review/ReviewReportModal'

// /auth/callback 以外のページでSupabaseの認証エラーハッシュを検知し、エラー画面へ転送する
const AuthHashRedirector = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/auth/callback') return

    const hash = window.location.hash
    if (!hash.includes('error=')) return

    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const error = hashParams.get('error')
    if (!error) return

    const errorCode = hashParams.get('error_code') ?? error
    navigate(`/auth/error?code=${encodeURIComponent(errorCode)}`, { replace: true })
  }, [pathname, navigate])

  return null
}

export const Layout = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <AuthHashRedirector />
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ToastStack />
    <LogoutConfirmModal />
    <DeleteAccountModal />
    <ReviewReportModal />
  </div>
)

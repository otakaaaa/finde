import { type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MAINTENANCE_MODE } from '@/config/features'
import { MaintenancePage } from '@/pages/MaintenancePage'

interface Props {
  children: ReactNode
}

export const MaintenanceGuard = ({ children }: Props) => {
  const { user, loading } = useAuth()

  if (!MAINTENANCE_MODE) return <>{children}</>

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user?.role === 'admin') return <>{children}</>

  return <MaintenancePage />
}

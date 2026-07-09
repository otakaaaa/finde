import { Outlet } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

/** 管理者専用ルートの共通レイアウト */
export default function RequireAdmin() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Outlet />
    </ProtectedRoute>
  )
}

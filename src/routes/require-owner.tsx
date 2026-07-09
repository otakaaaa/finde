import { Navigate, Outlet } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { OWNER_FEATURE_ENABLED } from '@/config/features'

/** オーナー専用ルート（機能フラグ + shop_owner ロール必須） */
export default function RequireOwner() {
  if (!OWNER_FEATURE_ENABLED) return <Navigate to="/" replace />
  return (
    <ProtectedRoute requiredRole="shop_owner">
      <Outlet />
    </ProtectedRoute>
  )
}

import { Navigate, Outlet } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { OWNER_FEATURE_ENABLED } from '@/config/features'

/** オーナー申請ルート（機能フラグ + 認証必須） */
export default function RequireOwnerFeature() {
  if (!OWNER_FEATURE_ENABLED) return <Navigate to="/" replace />
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}

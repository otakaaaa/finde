import { Navigate, Outlet } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { WISH_FEATURE_ENABLED } from '@/config/features'

/** ウィッシュ機能ルート（機能フラグ + 認証必須） */
export default function RequireWish() {
  if (!WISH_FEATURE_ENABLED) return <Navigate to="/" replace />
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}

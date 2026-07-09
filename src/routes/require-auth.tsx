import { Outlet } from 'react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

/** 認証必須ルートの共通レイアウト */
export default function RequireAuth() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}

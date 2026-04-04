import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: '/admin',
  shop_owner: '/owner',
  user: '/',
}

const CallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // OAuthコールバック時のエラー（既存アカウントの検出など）をURLハッシュから確認
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
      const errorCode = hashParams.get('error')
      const errorDescription = hashParams.get('error_description') ?? ''

      // 既存アカウントが検出された場合はアカウント統合ページへリダイレクト
      if (errorCode === 'identity_not_found' || errorDescription.includes('already exists')) {
        const email = hashParams.get('email') ?? ''
        navigate(`/auth/link-account?provider=google&email=${encodeURIComponent(email)}`)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        navigate('/auth/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single() as { data: { role: string } | null; error: unknown }

      const role = (data?.role ?? 'user') as UserRole
      localStorage.setItem('pending_login_toast', 'true')
      navigate(ROLE_REDIRECT[role] ?? '/')
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default CallbackPage

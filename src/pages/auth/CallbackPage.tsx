import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

const WELCOME_EMAIL_UID_KEY = 'pending_welcome_email_uid'

async function maybeSendWelcomeEmail(userId: string): Promise<void> {
  const pendingUid = localStorage.getItem(WELCOME_EMAIL_UID_KEY)
  if (pendingUid !== userId) return

  localStorage.removeItem(WELCOME_EMAIL_UID_KEY)
  try {
    await supabase.functions.invoke('send-welcome-email', {
      body: { user_id: userId },
    })
  } catch {
    // メール送信失敗はログに留め、画面遷移はブロックしない
    console.warn('[CallbackPage] welcome email failed')
  }
}

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

      // リンク期限切れ・アクセス拒否エラーはエラー画面へ
      if (errorCode === 'access_denied') {
        const errorSubCode = hashParams.get('error_code') ?? 'access_denied'
        navigate(`/auth/error?code=${encodeURIComponent(errorSubCode)}`, { replace: true })
        return
      }

      // メール変更確認リンクの処理（token_hash + type=email_change）
      const searchParams = new URLSearchParams(window.location.search)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (tokenHash && type === 'email_change') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email_change',
        })
        if (error) {
          navigate('/mypage/account?email_change_error=true')
        } else {
          navigate('/mypage/account?email_changed=true')
        }
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        navigate('/auth/login')
        return
      }

      // MFAが有効なユーザーはコード確認画面へリダイレクト
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData?.nextLevel === 'aal2' && aalData.nextLevel !== aalData.currentLevel) {
        navigate('/auth/mfa', { replace: true })
        return
      }

      await maybeSendWelcomeEmail(session.user.id)

      const { data } = await supabase
        .from('users')
        .select('role, display_name')
        .eq('id', session.user.id)
        .single() as { data: { role: string; display_name: string | null } | null; error: unknown }

      localStorage.setItem('pending_login_toast', 'true')

      // アカウント名が未設定（新規登録直後）の場合は設定画面へ誘導
      const displayName = data?.display_name ?? ''
      if (displayName.trim().length === 0) {
        navigate('/auth/setup-profile', { replace: true })
        return
      }

      const role = (data?.role ?? 'user') as UserRole
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

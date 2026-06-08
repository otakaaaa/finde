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

      // パスワードリセット確認リンクの処理（type=recovery がハッシュに含まれる）
      // Supabaseクライアントがハッシュからセッションを復元済みのためリセット画面へ転送
      if (hashParams.get('type') === 'recovery') {
        navigate('/auth/reset-password')
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

      await maybeSendWelcomeEmail(session.user.id)

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

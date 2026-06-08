import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import { OWNER_FEATURE_ENABLED } from '@/config/features'

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: '/admin',
  shop_owner: OWNER_FEATURE_ENABLED ? '/owner' : '/',
  user: '/',
}

export const useAuthActions = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const redirectByRole = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single() as { data: { role: string } | null; error: unknown }

    const role = (data?.role ?? 'user') as UserRole
    navigate(ROLE_REDIRECT[role] ?? '/')
  }

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      if (data.user) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalData?.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
          navigate('/auth/mfa')
          return
        }
        localStorage.setItem('pending_login_toast', 'true')
        await redirectByRole(data.user.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName } },
      })
      if (error) { setError(error.message); return }
      // メール確認不要設定の場合はそのままログイン
      if (data.user && data.session) {
        await redirectByRole(data.user.id)
      } else {
        if (data.user) {
          localStorage.setItem('pending_welcome_email_uid', data.user.id)
        }
        navigate('/auth/login?registered=true')
      }
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const sendPasswordReset = async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) { setError(error.message); return false }
      return true
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('ログインしてください')
        return false
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) { setError(error.message); return false }
      navigate('/')
      return true
    } finally {
      setLoading(false)
    }
  }

  const hasPasswordIdentity = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser()
    return (user?.identities ?? []).some((identity) => identity.provider === 'email')
  }

  const updateEmail = async (newEmail: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` },
      )
      if (error) { setError(error.message); return false }
      return true
    } finally {
      setLoading(false)
    }
  }

  const updatePasswordWithCurrent = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email
      if (!email) {
        setError('ログインしてください')
        return false
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        setError('現在のパスワードが正しくありません')
        return false
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) { setError(updateError.message); return false }
      return true
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    updatePassword,
    hasPasswordIdentity,
    updateEmail,
    updatePasswordWithCurrent,
    signOut,
  }
}

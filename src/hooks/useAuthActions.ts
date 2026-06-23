import { useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export const useAuthActions = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

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

  const signInWithTwitter = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
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
    signInWithGoogle,
    signInWithTwitter,
    hasPasswordIdentity,
    updateEmail,
    updatePasswordWithCurrent,
    signOut,
  }
}

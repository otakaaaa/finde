import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import type { User } from '@/types'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const fetchUser = async (id: string) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single() as { data: { id: string; role: string; display_name: string | null; avatar_url: string | null; created_at: string; updated_at: string } | null; error: unknown }

  const { setUser, setLoading } = useAuthStore.getState()

  if (data) {
    setUser({
      id: data.id,
      role: data.role as User['role'],
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    })
  }
  setLoading(false)
}

export const useAuth = (): AuthState => {
  const { session, user, loading, setSession, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    // Only set up the listener once (when loading is still true = first mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        if (session?.user) {
          fetchUser(session.user.id)
          if (event === 'SIGNED_IN') {
            useUiStore.getState().addToast({
              title: 'ログインしました',
              variant: 'default',
            })
          }
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (currentSession?.user) {
      await fetchUser(currentSession.user.id)
    }
  }

  return { session, user, loading, refreshUser }
}

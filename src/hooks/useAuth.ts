import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
}

export const useAuth = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session?.user) {
          fetchUser(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUser = async (id: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single() as { data: { id: string; role: string; display_name: string | null; avatar_url: string | null; created_at: string; updated_at: string } | null; error: unknown }

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

  return { session, user, loading }
}

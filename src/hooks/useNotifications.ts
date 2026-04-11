import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types'

export type { Notification }

interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link_url: string | null
  metadata: Record<string, string>
  is_read: boolean
  created_at: string
}

const mapRow = (row: NotificationRow): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as Notification['type'],
  title: row.title,
  body: row.body,
  linkUrl: row.link_url,
  metadata: row.metadata ?? {},
  isRead: row.is_read,
  createdAt: row.created_at,
})

export const useNotifications = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['notifications', user?.id]

  // ── 通知一覧取得 ──────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) as { data: NotificationRow[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  // ── Realtime 購読: 新規通知を即時反映 ────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = mapRow(payload.new as NotificationRow)
          queryClient.setQueryData<Notification[]>(queryKey, (prev) => [
            newNotif,
            ...(prev ?? []),
          ])
        },
      )
      .subscribe((status) => {
        // Realtime 切断時にクエリを再取得して最新状態に同期
        if (status === 'SUBSCRIBED') {
          queryClient.invalidateQueries({ queryKey })
        }
      })

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ── 個別既読 ──────────────────────────────────────────────
  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onMutate: (id) => {
      // 楽観的更新
      queryClient.setQueryData<Notification[]>(queryKey, (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? [],
      )
    },
  })

  // ── 全件既読 ──────────────────────────────────────────────
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('user_id', user.id)
        .eq('is_read', false) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onMutate: () => {
      // 楽観的更新
      queryClient.setQueryData<Notification[]>(queryKey, (prev) =>
        prev?.map((n) => ({ ...n, isRead: true })) ?? [],
      )
    },
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  }
}

// ── ページネーション対応（一覧ページ用） ───────────────────────

export const usePaginatedNotifications = (
  unreadOnly: boolean,
  page: number,
  pageSize: number,
) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const listKey = ['notifications-list', user?.id, unreadOnly, page, pageSize]
  const bellKey = ['notifications', user?.id]

  const query = useQuery({
    queryKey: listKey,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { items: [], totalCount: 0 }
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let q = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (unreadOnly) q = q.eq('is_read', false)

      const { data, count, error } = await (q as unknown as Promise<{
        data: NotificationRow[] | null
        count: number | null
        error: { message: string } | null
      }>)
      if (error) throw new Error(error.message)
      return { items: (data ?? []).map(mapRow), totalCount: count ?? 0 }
    },
  })

  const { mutate: markAsRead } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onMutate: (id) => {
      queryClient.setQueryData<{ items: Notification[]; totalCount: number }>(listKey, (prev) =>
        prev ? { ...prev, items: prev.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) } : prev,
      )
      // ベルアイコン側も同期
      queryClient.setQueryData<Notification[]>(bellKey, (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)) ?? [],
      )
    },
  })

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('user_id', user.id)
        .eq('is_read', false) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list', user?.id] })
      queryClient.invalidateQueries({ queryKey: bellKey })
    },
  })

  return {
    items: query.data?.items ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  }
}

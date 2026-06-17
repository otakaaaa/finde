import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { fetchMyScores } from '@/hooks/shareFetch'
import { SHARE_POST_SELECT, mapSharePostRow, type SharePostRow } from '@/hooks/shareMappers'
import type { SharePost } from '@/types'

/** 投稿詳細（RLS で可視性を強制）。閲覧不可・不存在は null。 */
export const useSharePost = (id: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['share-post', id, user?.id],
    queryFn: async (): Promise<SharePost | null> => {
      const { data, error } = await supabase
        .from('share_posts')
        .select(SHARE_POST_SELECT)
        .eq('id', id)
        .maybeSingle() as unknown as {
          data: SharePostRow | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      if (!data) return null

      const myScores = await fetchMyScores([data.id], user?.id)
      return mapSharePostRow(data, myScores[data.id] ?? null)
    },
    enabled: !!id,
  })
}

const fetchMyPosts = async (userId: string, state: 'published' | 'draft'): Promise<SharePost[]> => {
  const { data, error } = await supabase
    .from('share_posts')
    .select(SHARE_POST_SELECT)
    .eq('user_id', userId)
    .eq('state', state)
    .order('created_at', { ascending: false }) as unknown as {
      data: SharePostRow[] | null
      error: { message: string } | null
    }

  if (error) throw new Error(error.message)
  // 自分の投稿に自分でシャレ度は付かないため myScore は null
  return (data ?? []).map((row) => mapSharePostRow(row, null))
}

/** マイページ管理：自分の公開投稿 */
export const useMyShares = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-shares', user?.id],
    queryFn: () => fetchMyPosts(user!.id, 'published'),
    enabled: !!user,
  })
}

/** マイページ管理：自分の下書き */
export const useMyDrafts = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-share-drafts', user?.id],
    queryFn: () => fetchMyPosts(user!.id, 'draft'),
    enabled: !!user,
  })
}

/** 店舗に関連付けられた公開投稿一覧 */
export const useSharePostsByShop = (shopId: string) =>
  useQuery({
    queryKey: ['share-posts-by-shop', shopId],
    queryFn: async (): Promise<SharePost[]> => {
      const { data: links, error: linksError } = await supabase
        .from('share_post_shops')
        .select('post_id')
        .eq('shop_id', shopId) as unknown as {
          data: { post_id: string }[] | null
          error: { message: string } | null
        }

      if (linksError) throw new Error(linksError.message)
      if (!links || links.length === 0) return []

      const postIds = links.map((l) => l.post_id)

      const { data, error } = await supabase
        .from('share_posts')
        .select(SHARE_POST_SELECT)
        .in('id', postIds)
        .eq('state', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false }) as unknown as {
          data: SharePostRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map((row) => mapSharePostRow(row, null))
    },
    enabled: !!shopId,
  })

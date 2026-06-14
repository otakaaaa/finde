import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { fetchMyScores } from '@/hooks/shareFetch'
import { SHARE_POST_SELECT_BASE, mapSharePostRow, type SharePostRow } from '@/hooks/shareMappers'
import type { SharePost } from '@/types'

/** ブックマークの追加/解除（楽観的更新は詳細キャッシュに反映） */
export const useToggleBookmark = (postId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const detailKey = ['share-post', postId, user?.id]

  return useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (!user) throw new Error('ログインが必要です')

      if (isBookmarked) {
        const { error } = await supabase
          .from('share_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id) as unknown as { error: { message: string } | null }
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('share_bookmarks')
          .insert({ post_id: postId, user_id: user.id } as never) as unknown as {
            error: { message: string } | null
          }
        if (error) throw new Error(error.message)
      }
    },
    onMutate: async (isBookmarked) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<SharePost | null>(detailKey)
      if (previous) {
        queryClient.setQueryData<SharePost | null>(detailKey, {
          ...previous,
          isBookmarked: !isBookmarked,
          bookmarkCount: previous.bookmarkCount + (isBookmarked ? -1 : 1),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(detailKey, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['share-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-bookmarks', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['share-timeline'] })
    },
  })
}

interface BookmarkRow {
  post_id: string
  post: SharePostRow | null
}

/** 自分のブックマーク一覧（あとで見返す） */
export const useMyBookmarks = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['share-bookmarks', user?.id],
    queryFn: async (): Promise<SharePost[]> => {
      const { data, error } = await supabase
        .from('share_bookmarks')
        .select(`post_id, created_at, post:share_posts ( ${SHARE_POST_SELECT_BASE} )`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }) as unknown as {
          data: BookmarkRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)

      // 非公開化された投稿は RLS で post が null になるため除外
      const posts = (data ?? [])
        .map((r) => r.post)
        .filter((p): p is SharePostRow => p !== null)

      const myScores = await fetchMyScores(posts.map((p) => p.id), user?.id)
      // この一覧は自分がブックマーク済みの投稿なので isBookmarked は常に true
      return posts.map((p) => ({ ...mapSharePostRow(p, myScores[p.id] ?? null), isBookmarked: true }))
    },
    enabled: !!user,
  })
}

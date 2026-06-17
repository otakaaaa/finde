import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { SHARE_COMMENT_SELECT, mapShareCommentRow, type ShareCommentRow } from '@/hooks/shareMappers'
import type { ShareComment } from '@/types'

export const useShareComments = (postId: string) => {
  return useQuery({
    queryKey: ['share-comments', postId],
    queryFn: async (): Promise<ShareComment[]> => {
      const { data, error } = await supabase
        .from('share_comments')
        .select(SHARE_COMMENT_SELECT)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }) as unknown as {
          data: ShareCommentRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapShareCommentRow)
    },
    enabled: !!postId,
  })
}

export const useAddComment = (postId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('ログインが必要です')

      const { error } = await supabase
        .from('share_comments')
        .insert({ post_id: postId, user_id: user.id, body } as never) as unknown as {
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-timeline'] })
      queryClient.invalidateQueries({ queryKey: ['share-posts-by-shop'] })
    },
  })
}

export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('share_comments')
        .delete()
        .eq('id', commentId) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-timeline'] })
      queryClient.invalidateQueries({ queryKey: ['share-posts-by-shop'] })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/** シャレ度（1〜10）を送る。1投稿1ユーザー1票・upsert で上書き。 */
export const useRateShare = (postId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (score: number) => {
      if (!user) throw new Error('ログインが必要です')
      if (score < 1 || score > 10) throw new Error('シャレ度は1〜10で指定してください')

      const { error } = await supabase
        .from('share_ratings')
        .upsert(
          { post_id: postId, user_id: user.id, score } as never,
          { onConflict: 'post_id,user_id' },
        ) as unknown as { error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-post', postId] })
      queryClient.invalidateQueries({ queryKey: ['share-timeline'] })
    },
  })
}

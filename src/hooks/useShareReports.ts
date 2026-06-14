import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface ReportShareInput {
  postId?: string
  commentId?: string
  reason?: string
}

/** 投稿・コメントの通報 */
export const useReportShare = () => {
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: ReportShareInput) => {
      if (!user) throw new Error('ログインが必要です')
      if (!input.postId && !input.commentId) throw new Error('通報対象が指定されていません')

      const { error } = await supabase
        .from('share_post_reports')
        .insert({
          post_id: input.postId ?? null,
          comment_id: input.commentId ?? null,
          reported_by: user.id,
          reason: input.reason ?? null,
        } as never) as unknown as { error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
  })
}

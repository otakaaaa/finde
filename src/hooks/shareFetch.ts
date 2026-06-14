import { supabase } from '@/lib/supabase'

interface MyScoreRow {
  post_id: string
  score: number
}

/**
 * 指定した投稿群に対する「自分のシャレ度」を post_id => score の辞書で返す。
 * 未ログイン or 対象なしのときは空辞書。
 */
export const fetchMyScores = async (
  ids: string[],
  userId: string | undefined,
): Promise<Record<string, number>> => {
  if (!userId || ids.length === 0) return {}

  const { data, error } = await supabase
    .from('share_ratings')
    .select('post_id, score')
    .eq('user_id', userId)
    .in('post_id', ids) as {
      data: MyScoreRow[] | null
      error: { message: string } | null
    }

  if (error) throw new Error(error.message)

  const map: Record<string, number> = {}
  for (const row of data ?? []) map[row.post_id] = row.score
  return map
}

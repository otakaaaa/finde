import { useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * インプレッション記録のコールバックを返す。
 * 同一セッション内の重複呼び出しは抑制（サーバ側でも日次ユニーク）。
 * fire-and-forget（失敗は無視）。
 */
export const useRecordImpression = () => {
  const recordedRef = useRef<Set<string>>(new Set())

  return useCallback((postId: string) => {
    if (recordedRef.current.has(postId)) return
    recordedRef.current.add(postId)
    void supabase.rpc('record_share_impression', { p_post: postId } as never)
  }, [])
}

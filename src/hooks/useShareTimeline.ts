import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { fetchMyScores } from '@/hooks/shareFetch'
import { SHARE_POST_SELECT, mapSharePostRow, type SharePostRow } from '@/hooks/shareMappers'
import type { SharePost, ShareTimelineTab } from '@/types'

const PAGE_SIZE = 20

interface ShareCursor {
  ts: string | null   // recent: 前ページ末尾の published_at
  id: string | null   // recent: 同 published_at のタイブレーク
  offset: number      // hot: OFFSET
}

const INITIAL_CURSOR: ShareCursor = { ts: null, id: null, offset: 0 }

interface TimelinePage {
  items: SharePost[]
  nextParam: ShareCursor | null
}

interface RpcRow {
  id: string
  published_at: string | null
}

const fetchTimeline = async (
  tab: ShareTimelineTab,
  cursor: ShareCursor,
  userId: string | undefined,
): Promise<TimelinePage> => {
  // 1. RPC で並び順とページ分のIDを取得（PAGE_SIZE+1 で次ページ有無を判定）
  const { data: ordered, error: rpcError } = await supabase.rpc('get_share_timeline', {
    p_tab: tab,
    p_limit: PAGE_SIZE + 1,
    p_cursor_ts: cursor.ts,
    p_cursor_id: cursor.id,
    p_offset: cursor.offset,
  } as never) as unknown as { data: RpcRow[] | null; error: { message: string } | null }

  if (rpcError) throw new Error(rpcError.message)

  const rows = ordered ?? []
  const hasNext = rows.length > PAGE_SIZE
  const pageRows = hasNext ? rows.slice(0, PAGE_SIZE) : rows
  const ids = pageRows.map((r) => r.id)

  if (ids.length === 0) {
    return { items: [], nextParam: null }
  }

  // 2. 詳細（join・閲覧者依存値）を取得し、RPC の順序で並べ直す
  const [{ data: detail, error: detailError }, myScores] = await Promise.all([
    supabase.from('share_posts').select(SHARE_POST_SELECT).in('id', ids) as unknown as Promise<{
      data: SharePostRow[] | null
      error: { message: string } | null
    }>,
    fetchMyScores(ids, userId),
  ])

  if (detailError) throw new Error(detailError.message)

  const byId = new Map<string, SharePostRow>()
  for (const row of detail ?? []) byId.set(row.id, row)

  const items = ids
    .map((id) => byId.get(id))
    .filter((row): row is SharePostRow => row !== undefined)
    .map((row) => mapSharePostRow(row, myScores[row.id] ?? null))

  // 3. 次ページカーソル
  let nextParam: ShareCursor | null = null
  if (hasNext) {
    const last = pageRows[pageRows.length - 1]
    nextParam =
      tab === 'recent'
        ? { ts: last.published_at, id: last.id, offset: 0 }
        : { ts: null, id: null, offset: cursor.offset + PAGE_SIZE }
  }

  return { items, nextParam }
}

export const useShareTimeline = (tab: ShareTimelineTab) => {
  const { user } = useAuth()

  return useInfiniteQuery({
    queryKey: ['share-timeline', tab, user?.id],
    queryFn: ({ pageParam }) => fetchTimeline(tab, pageParam, user?.id),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextParam ?? undefined,
  })
}

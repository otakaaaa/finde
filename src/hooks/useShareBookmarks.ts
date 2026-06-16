import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { fetchMyScores } from '@/hooks/shareFetch'
import { SHARE_POST_SELECT_BASE, mapSharePostRow, type SharePostRow } from '@/hooks/shareMappers'
import type { SharePost, ShareBookmarkFolder } from '@/types'

// ── フォルダ一覧 ──────────────────────────────────────────────────

interface FolderRow {
  id: string
  name: string
  created_at: string
}

export const useMyBookmarkFolders = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['share-bookmark-folders', user?.id],
    queryFn: async (): Promise<ShareBookmarkFolder[]> => {
      const { data, error } = await supabase
        .from('share_bookmark_folders')
        .select('id, name, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true }) as unknown as {
          data: FolderRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }))
    },
    enabled: !!user,
  })
}

// ── フォルダ作成 ──────────────────────────────────────────────────

export const useCreateBookmarkFolder = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (name: string): Promise<ShareBookmarkFolder> => {
      if (!user) throw new Error('ログインが必要です')
      const { data, error } = await supabase
        .from('share_bookmark_folders')
        .insert({ user_id: user.id, name: name.trim() } as never)
        .select('id, name, created_at')
        .single() as unknown as { data: FolderRow | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return { id: data!.id, name: data!.name, createdAt: data!.created_at }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-bookmark-folders', user?.id] })
    },
  })
}

// ── フォルダ名変更 ────────────────────────────────────────────────

export const useRenameBookmarkFolder = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!user) throw new Error('ログインが必要です')
      const { error } = await supabase
        .from('share_bookmark_folders')
        .update({ name: name.trim() } as never)
        .eq('id', id)
        .eq('user_id', user.id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-bookmark-folders', user?.id] })
    },
  })
}

// ── フォルダ削除 ──────────────────────────────────────────────────

export const useDeleteBookmarkFolder = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!user) throw new Error('ログインが必要です')
      const { error } = await supabase
        .from('share_bookmark_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-bookmark-folders', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['share-bookmarks', user?.id] })
    },
  })
}

// ── ブックマーク追加/解除 ─────────────────────────────────────────

interface ToggleBookmarkArgs {
  isBookmarked: boolean
  folderId?: string | null
}

/** ブックマークの追加（フォルダ指定可）/解除 */
export const useToggleBookmark = (postId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const detailKey = ['share-post', postId, user?.id]

  return useMutation({
    mutationFn: async ({ isBookmarked, folderId }: ToggleBookmarkArgs) => {
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
          .insert({ post_id: postId, user_id: user.id, folder_id: folderId ?? null } as never) as unknown as {
            error: { message: string } | null
          }
        if (error) throw new Error(error.message)
      }
    },
    onMutate: async ({ isBookmarked, folderId }) => {
      await queryClient.cancelQueries({ queryKey: detailKey })
      const previous = queryClient.getQueryData<SharePost | null>(detailKey)
      if (previous) {
        queryClient.setQueryData<SharePost | null>(detailKey, {
          ...previous,
          isBookmarked: !isBookmarked,
          bookmarkFolderId: isBookmarked ? null : (folderId ?? null),
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

// ── ブックマーク一覧 ──────────────────────────────────────────────

interface BookmarkRow {
  post_id: string
  folder_id: string | null
  post: SharePostRow | null
}

/**
 * 自分のブックマーク一覧。
 * folderId: 'all' → すべて, null → フォルダなし(未分類), string → 指定フォルダ
 */
export const useMyBookmarks = (folderId: string | null) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['share-bookmarks', user?.id, folderId],
    queryFn: async (): Promise<SharePost[]> => {
      let query = supabase
        .from('share_bookmarks')
        .select(`post_id, folder_id, created_at, post:share_posts ( ${SHARE_POST_SELECT_BASE} )`)
        .eq('user_id', user!.id)

      // order より前にフィルターを適用する
      if (folderId === null) {
        query = query.is('folder_id', null)
      } else if (folderId !== 'all') {
        query = query.eq('folder_id', folderId)
      }
      // folderId === 'all' のときはフィルターなし（全件取得）

      const { data, error } = await query
        .order('created_at', { ascending: false }) as unknown as {
          data: BookmarkRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)

      const rows = (data ?? []).filter(
        (r): r is BookmarkRow & { post: SharePostRow } => r.post !== null,
      )
      const myScores = await fetchMyScores(rows.map((r) => r.post.id), user?.id)

      return rows.map((r) => ({
        ...mapSharePostRow(r.post, myScores[r.post.id] ?? null),
        isBookmarked: true,
        bookmarkFolderId: r.folder_id,
      }))
    },
    enabled: !!user,
  })
}

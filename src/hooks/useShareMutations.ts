import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ShareState, ShareVisibility } from '@/types'

const BUCKET = 'share-photos'
const MAX_PHOTOS = 5

export interface CreateShareInput {
  body: string
  visibility: ShareVisibility
  state: ShareState
  shopIds: string[]
  files: File[]
}

export interface UpdateShareInput {
  id: string
  body: string
  visibility: ShareVisibility
  state: ShareState
  shopIds: string[]
  keepPhotoIds: string[]
  newFiles: File[]
}

interface ExistingPhoto {
  id: string
  storage_path: string
}

// ── 画像アップロード（startOrder から連番）────────────────────
const uploadPhotos = async (
  userId: string,
  postId: string,
  files: File[],
  startOrder: number,
): Promise<void> => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${postId}/${crypto.randomUUID()}.${ext}`

    const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
    if (storageErr) throw new Error(storageErr.message)

    const { error: rowErr } = await supabase
      .from('share_post_photos')
      .insert({ post_id: postId, storage_path: path, order: startOrder + i } as never) as unknown as {
        error: { message: string } | null
      }
    if (rowErr) {
      await supabase.storage.from(BUCKET).remove([path])
      throw new Error(rowErr.message)
    }
  }
}

const replaceShops = async (postId: string, shopIds: string[]): Promise<void> => {
  await supabase.from('share_post_shops').delete().eq('post_id', postId)
  if (shopIds.length === 0) return
  const rows = shopIds.map((shopId) => ({ post_id: postId, shop_id: shopId }))
  const { error } = await supabase
    .from('share_post_shops')
    .insert(rows as never) as unknown as { error: { message: string } | null }
  if (error) throw new Error(error.message)
}

const invalidateShareQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  postId?: string,
) => {
  queryClient.invalidateQueries({ queryKey: ['share-timeline'] })
  queryClient.invalidateQueries({ queryKey: ['my-shares', userId] })
  queryClient.invalidateQueries({ queryKey: ['my-share-drafts', userId] })
  if (postId) queryClient.invalidateQueries({ queryKey: ['share-post', postId] })
}

export const useCreateShare = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateShareInput) => {
      if (!user) throw new Error('ログインが必要です')
      if (input.files.length > MAX_PHOTOS) throw new Error(`画像は最大${MAX_PHOTOS}枚までです`)

      const { data, error } = await supabase
        .from('share_posts')
        .insert({
          user_id: user.id,
          body: input.body,
          visibility: input.visibility,
          state: input.state,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      if (!data) throw new Error('投稿の作成に失敗しました')

      await replaceShops(data.id, input.shopIds)
      await uploadPhotos(user.id, data.id, input.files, 0)
      return data.id
    },
    onSuccess: () => invalidateShareQueries(queryClient, user?.id),
  })
}

export const useUpdateShare = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: UpdateShareInput) => {
      if (!user) throw new Error('ログインが必要です')

      // 1. 本文・公開範囲・公開状態
      const { error: updateErr } = await supabase
        .from('share_posts')
        .update({
          body: input.body,
          visibility: input.visibility,
          state: input.state,
        } as never)
        .eq('id', input.id) as unknown as { error: { message: string } | null }
      if (updateErr) throw new Error(updateErr.message)

      // 2. 画像：keepPhotoIds 以外を削除し、新規を追加
      const { data: existing, error: fetchErr } = await supabase
        .from('share_post_photos')
        .select('id, storage_path')
        .eq('post_id', input.id)
        .order('order', { ascending: true }) as {
          data: ExistingPhoto[] | null
          error: { message: string } | null
        }
      if (fetchErr) throw new Error(fetchErr.message)

      const kept = (existing ?? []).filter((p) => input.keepPhotoIds.includes(p.id))
      const removed = (existing ?? []).filter((p) => !input.keepPhotoIds.includes(p.id))

      if (kept.length + input.newFiles.length > MAX_PHOTOS) {
        throw new Error(`画像は最大${MAX_PHOTOS}枚までです`)
      }

      if (removed.length > 0) {
        await supabase.storage.from(BUCKET).remove(removed.map((p) => p.storage_path))
        await supabase
          .from('share_post_photos')
          .delete()
          .in('id', removed.map((p) => p.id))
      }

      await uploadPhotos(user.id, input.id, input.newFiles, kept.length)

      // 3. 店舗
      await replaceShops(input.id, input.shopIds)
      return input.id
    },
    onSuccess: (postId) => invalidateShareQueries(queryClient, user?.id, postId),
  })
}

export const useDeleteShare = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (postId: string) => {
      // ストレージのオブジェクトを先に削除（行は cascade で消える）
      const { data: photos } = await supabase
        .from('share_post_photos')
        .select('storage_path')
        .eq('post_id', postId) as { data: { storage_path: string }[] | null; error: unknown }

      if (photos && photos.length > 0) {
        await supabase.storage.from(BUCKET).remove(photos.map((p) => p.storage_path))
      }

      const { error } = await supabase
        .from('share_posts')
        .delete()
        .eq('id', postId) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => invalidateShareQueries(queryClient, user?.id),
  })
}

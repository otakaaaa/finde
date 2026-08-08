import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { toNullableInput } from '@/lib/shopAnnouncement'
import { safeExternalHref } from '@/lib/url'
import type { ShopAnnouncement, ShopAnnouncementFormValues } from '@/types'

export const SHOP_ANNOUNCEMENT_BUCKET = 'shop-announcements'

// ── Row type ───────────────────────────────────────────────────

interface ShopAnnouncementRow {
  id: string
  shop_id: string
  title: string
  body: string
  link_url: string | null
  image_path: string | null
  is_active: boolean
  notify_in_app: boolean
  notify_email: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

const SELECT =
  'id, shop_id, title, body, link_url, image_path, is_active, notify_in_app, notify_email, starts_at, ends_at, created_at, updated_at'

const mapRow = (row: ShopAnnouncementRow): ShopAnnouncement => ({
  id: row.id,
  shopId: row.shop_id,
  title: row.title,
  body: row.body,
  linkUrl: row.link_url,
  imagePath: row.image_path,
  isActive: row.is_active,
  notifyInApp: row.notify_in_app,
  notifyEmail: row.notify_email,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const orderedQuery = (shopId: string) =>
  supabase
    .from('shop_announcements')
    .select(SELECT)
    .eq('shop_id', shopId)
    .order('starts_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false }) as unknown as Promise<{
    data: ShopAnnouncementRow[] | null
    error: { message: string } | null
  }>

// ── 詳細ページ表示用（RLS で掲載中のみに絞られる） ──────────────

export const usePublicShopAnnouncements = (shopId: string) =>
  useQuery({
    queryKey: ['shop-announcements', 'public', shopId],
    queryFn: async () => {
      const { data, error } = await orderedQuery(shopId)
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!shopId,
  })

// ── オーナー管理用（全件） ──────────────────────────────────────

export const useShopAnnouncements = (
  shopId: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ['shop-announcements', 'owner', shopId],
    queryFn: async () => {
      const { data, error } = await orderedQuery(shopId)
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!shopId && (options?.enabled ?? true),
  })

const invalidate = (shopId: string) => (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['shop-announcements', 'owner', shopId] })
  queryClient.invalidateQueries({ queryKey: ['shop-announcements', 'public', shopId] })
}

// 共通: フォーム値 → DB 更新ペイロード（image_path 以外）
const toPayload = (values: ShopAnnouncementFormValues) => ({
  title: values.title.trim(),
  body: values.body.trim(),
  // http/https 以外（javascript: 等）は保存しない — 格納型XSS対策
  link_url: safeExternalHref(toNullableInput(values.linkUrl) ?? undefined) ?? null,
  is_active: values.isActive,
  notify_in_app: values.notifyInApp,
  notify_email: values.notifyEmail,
  starts_at: toNullableInput(values.startsAt),
  ends_at: toNullableInput(values.endsAt),
})

const newImagePath = (shopId: string) => `${shopId}/${crypto.randomUUID()}.webp`

export const useCreateShopAnnouncement = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      values,
      file,
    }: {
      values: ShopAnnouncementFormValues
      file: File | null
    }) => {
      let imagePath: string | null = null
      if (file) {
        imagePath = newImagePath(shopId)
        await uploadToR2(SHOP_ANNOUNCEMENT_BUCKET, imagePath, file)
      }
      const { error } = await supabase
        .from('shop_announcements')
        .insert({ shop_id: shopId, image_path: imagePath, ...toPayload(values) } as never) as unknown as {
        error: { message: string } | null
      }
      if (error) {
        if (imagePath) await deleteFromR2(SHOP_ANNOUNCEMENT_BUCKET, [imagePath])
        throw new Error(error.message)
      }
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

export const useUpdateShopAnnouncement = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
      file,
      currentImagePath,
      removeImage,
    }: {
      id: string
      values: ShopAnnouncementFormValues
      file: File | null
      currentImagePath: string | null
      removeImage: boolean
    }) => {
      let imagePath = currentImagePath
      let staleImage: string | null = null

      if (file) {
        const uploaded = newImagePath(shopId)
        await uploadToR2(SHOP_ANNOUNCEMENT_BUCKET, uploaded, file)
        imagePath = uploaded
        if (currentImagePath) staleImage = currentImagePath
      } else if (removeImage && currentImagePath) {
        imagePath = null
        staleImage = currentImagePath
      }

      const { error } = await supabase
        .from('shop_announcements')
        .update({ image_path: imagePath, ...toPayload(values) } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }

      if (error) {
        // 失敗時、新規アップロード分があれば打ち消す
        if (file && imagePath) await deleteFromR2(SHOP_ANNOUNCEMENT_BUCKET, [imagePath])
        throw new Error(error.message)
      }
      // 成功したら不要になった旧画像を削除
      if (staleImage) await deleteFromR2(SHOP_ANNOUNCEMENT_BUCKET, [staleImage])
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

export const useDeleteShopAnnouncement = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string | null }) => {
      if (imagePath) await deleteFromR2(SHOP_ANNOUNCEMENT_BUCKET, [imagePath])
      const { error } = await supabase
        .from('shop_announcements')
        .delete()
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

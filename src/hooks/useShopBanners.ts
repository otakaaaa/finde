import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { toNullableInput } from '@/lib/shopBanner'
import type { ShopBanner, ShopBannerFormValues, BannerPlacement } from '@/types'

export const SHOP_BANNER_BUCKET = 'shop-banners'

// ── Row type ───────────────────────────────────────────────────

interface ShopBannerRow {
  id: string
  shop_id: string
  image_path: string
  link_url: string | null
  order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  placements: string[]
  created_at: string
  updated_at: string
}

const SELECT = 'id, shop_id, image_path, link_url, order, is_active, starts_at, ends_at, placements, created_at, updated_at'

const mapRow = (row: ShopBannerRow): ShopBanner => ({
  id: row.id,
  shopId: row.shop_id,
  imagePath: row.image_path,
  linkUrl: row.link_url,
  order: row.order,
  isActive: row.is_active,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  placements: (row.placements ?? []) as BannerPlacement[],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

// ── 詳細ページ表示用（RLS で掲載中のみに絞られる） ──────────────

export const usePublicShopBanners = (shopId: string) =>
  useQuery({
    queryKey: ['shop-banners', 'public', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_banners')
        .select(SELECT)
        .eq('shop_id', shopId)
        .order('order', { ascending: true }) as unknown as {
          data: ShopBannerRow[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!shopId,
  })

// ── オーナー管理用（全件） ──────────────────────────────────────

export const useShopBanners = (shopId: string) =>
  useQuery({
    queryKey: ['shop-banners', 'owner', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_banners')
        .select(SELECT)
        .eq('shop_id', shopId)
        .order('order', { ascending: true }) as unknown as {
          data: ShopBannerRow[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!shopId,
  })

const invalidate = (shopId: string) => (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['shop-banners', 'owner', shopId] })
  queryClient.invalidateQueries({ queryKey: ['shop-banners', 'public', shopId] })
}

export const useCreateShopBanner = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      values,
      nextOrder,
    }: {
      file: File
      values: ShopBannerFormValues
      nextOrder: number
    }) => {
      const path = `${shopId}/${crypto.randomUUID()}.webp`
      await uploadToR2(SHOP_BANNER_BUCKET, path, file)
      const { error } = await supabase
        .from('shop_banners')
        .insert({
          shop_id: shopId,
          image_path: path,
          link_url: toNullableInput(values.linkUrl),
          order: nextOrder,
          is_active: values.isActive,
          starts_at: toNullableInput(values.startsAt),
          ends_at: toNullableInput(values.endsAt),
          placements: values.placements,
        } as never) as unknown as { error: { message: string } | null }
      if (error) {
        await deleteFromR2(SHOP_BANNER_BUCKET, [path])
        throw new Error(error.message)
      }
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

export const useUpdateShopBanner = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ShopBannerFormValues }) => {
      const { error } = await supabase
        .from('shop_banners')
        .update({
          link_url: toNullableInput(values.linkUrl),
          is_active: values.isActive,
          starts_at: toNullableInput(values.startsAt),
          ends_at: toNullableInput(values.endsAt),
          placements: values.placements,
        } as never)
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

export const useDeleteShopBanner = (shopId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, imagePath }: { id: string; imagePath: string }) => {
      await deleteFromR2(SHOP_BANNER_BUCKET, [imagePath])
      const { error } = await supabase
        .from('shop_banners')
        .delete()
        .eq('id', id) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => invalidate(shopId)(queryClient),
  })
}

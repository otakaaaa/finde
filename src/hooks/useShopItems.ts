import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import type { ShopItem, ShopItemFormValues } from '@/types'

// ── Row types ──────────────────────────────────────────────────

interface ShopItemPhotoRow {
  id: string
  shop_item_id: string
  storage_path: string
  order: number
  created_at: string
}

interface ShopItemMaterialRow {
  material_type_id: number
  material_types: { id: number; name: string }
}

interface ShopItemRow {
  id: string
  shop_id: string
  item_type_id: number | null
  brand_id: string | null
  name: string
  description: string | null
  size_ids: number[]
  is_available: boolean
  created_at: string
  updated_at: string
  item_types: { id: number; code: string; name: string; item_category_id: number } | null
  brands: { id: string; name: string } | null
  shop_item_photos: ShopItemPhotoRow[]
  shop_item_materials: ShopItemMaterialRow[]
}

const SHOP_ITEM_SELECT = `
  id, shop_id, item_type_id, brand_id, name, description, size_ids, is_available, created_at, updated_at,
  item_types ( id, code, name, item_category_id ),
  brands ( id, name ),
  shop_item_photos ( id, shop_item_id, storage_path, order, created_at ),
  shop_item_materials ( material_type_id, material_types ( id, name ) )
`.trim()

const mapRow = (row: ShopItemRow): ShopItem => ({
  id: row.id,
  shopId: row.shop_id,
  itemTypeId: row.item_type_id,
  itemType: row.item_types
    ? { id: row.item_types.id, code: row.item_types.code, name: row.item_types.name, itemCategoryId: row.item_types.item_category_id }
    : null,
  brandId: row.brand_id,
  brand: row.brands ?? null,
  name: row.name,
  description: row.description,
  sizeIds: row.size_ids,
  isAvailable: row.is_available,
  materials: row.shop_item_materials.map((m) => ({ id: m.material_types.id, name: m.material_types.name })),
  photos: row.shop_item_photos
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      shopItemId: p.shop_item_id,
      storagePath: p.storage_path,
      order: p.order,
      createdAt: p.created_at,
    })),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

// ── Queries ────────────────────────────────────────────────────

export const useShopItems = (shopId: string) =>
  useQuery({
    queryKey: ['shop-items', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select(SHOP_ITEM_SELECT)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false }) as unknown as {
          data: ShopItemRow[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return (data ?? []).map(mapRow)
    },
    enabled: !!shopId,
  })

export const useShopItem = (itemId: string) =>
  useQuery({
    queryKey: ['shop-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_items')
        .select(SHOP_ITEM_SELECT)
        .eq('id', itemId)
        .single() as unknown as { data: ShopItemRow | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      if (!data) throw new Error('アイテムが見つかりません')
      return mapRow(data)
    },
    enabled: !!itemId,
  })

// ── Create mutation ────────────────────────────────────────────

interface CreateShopItemArgs {
  shopId: string
  values: ShopItemFormValues
  photoFiles: File[]
}

export const useCreateShopItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ shopId, values, photoFiles }: CreateShopItemArgs) => {
      // 1. Insert shop_item
      const { data: item, error: itemErr } = await supabase
        .from('shop_items')
        .insert({
          shop_id: shopId,
          item_type_id: values.itemTypeId ?? null,
          brand_id: values.brandId ?? null,
          name: values.name,
          description: values.description ?? null,
          size_ids: values.sizeIds,
          is_available: values.isAvailable,
        } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (itemErr || !item) throw new Error(itemErr?.message ?? 'アイテムの作成に失敗しました')
      const itemId = item.id

      // 2. Insert materials (bulk)
      if (values.materialTypeIds.length > 0) {
        const { error: matErr } = await supabase
          .from('shop_item_materials')
          .insert(
            values.materialTypeIds.map((mid) => ({ shop_item_id: itemId, material_type_id: mid })) as never,
          ) as unknown as { error: { message: string } | null }
        if (matErr) throw new Error(matErr.message)
      }

      // 3. Upload photos to R2 and insert photo records
      if (photoFiles.length > 0) {
        const photoInserts: { shop_item_id: string; storage_path: string; order: number }[] = []

        await Promise.all(
          photoFiles.map(async (file, idx) => {
            const ext = 'webp'
            const uuid = crypto.randomUUID()
            const path = `${shopId}/${itemId}/${uuid}.${ext}`
            await uploadToR2('shop-items', path, file)
            photoInserts.push({ shop_item_id: itemId, storage_path: path, order: idx })
          }),
        )

        const { error: photoErr } = await supabase
          .from('shop_item_photos')
          .insert(photoInserts as never) as unknown as { error: { message: string } | null }
        if (photoErr) throw new Error(photoErr.message)
      }

      return itemId
    },
    onSuccess: (_itemId, { shopId }) => {
      queryClient.invalidateQueries({ queryKey: ['shop-items', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop-item-types', shopId] })
    },
  })
}

// ── Update mutation ────────────────────────────────────────────

interface UpdateShopItemArgs {
  itemId: string
  shopId: string
  values: ShopItemFormValues
  newPhotoFiles: File[]
  deletedPhotoIds: string[]
  deletedPhotoPaths: string[]
}

export const useUpdateShopItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, shopId, values, newPhotoFiles, deletedPhotoIds, deletedPhotoPaths }: UpdateShopItemArgs) => {
      // 1. Update shop_item
      const { error: itemErr } = await supabase
        .from('shop_items')
        .update({
          item_type_id: values.itemTypeId ?? null,
          brand_id: values.brandId ?? null,
          name: values.name,
          description: values.description ?? null,
          size_ids: values.sizeIds,
          is_available: values.isAvailable,
        } as never)
        .eq('id', itemId) as unknown as { error: { message: string } | null }
      if (itemErr) throw new Error(itemErr.message)

      // 2. Replace materials (delete all, re-insert)
      await supabase.from('shop_item_materials').delete().eq('shop_item_id', itemId)
      if (values.materialTypeIds.length > 0) {
        const { error: matErr } = await supabase
          .from('shop_item_materials')
          .insert(
            values.materialTypeIds.map((mid) => ({ shop_item_id: itemId, material_type_id: mid })) as never,
          ) as unknown as { error: { message: string } | null }
        if (matErr) throw new Error(matErr.message)
      }

      // 3. Delete removed photos from R2 + DB
      if (deletedPhotoPaths.length > 0) {
        await deleteFromR2('shop-items', deletedPhotoPaths)
      }
      if (deletedPhotoIds.length > 0) {
        await supabase.from('shop_item_photos').delete().in('id', deletedPhotoIds)
      }

      // 4. Upload new photos
      if (newPhotoFiles.length > 0) {
        const { data: existingPhotos } = await supabase
          .from('shop_item_photos')
          .select('order')
          .eq('shop_item_id', itemId)
          .order('order', { ascending: false })
          .limit(1) as unknown as { data: { order: number }[] | null }

        let nextOrder = ((existingPhotos?.[0]?.order ?? -1) + 1)
        const photoInserts: { shop_item_id: string; storage_path: string; order: number }[] = []

        await Promise.all(
          newPhotoFiles.map(async (file) => {
            const uuid = crypto.randomUUID()
            const path = `${shopId}/${itemId}/${uuid}.webp`
            await uploadToR2('shop-items', path, file)
            photoInserts.push({ shop_item_id: itemId, storage_path: path, order: nextOrder++ })
          }),
        )

        const { error: photoErr } = await supabase
          .from('shop_item_photos')
          .insert(photoInserts as never) as unknown as { error: { message: string } | null }
        if (photoErr) throw new Error(photoErr.message)
      }
    },
    onSuccess: (_data, { itemId, shopId }) => {
      queryClient.invalidateQueries({ queryKey: ['shop-items', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop-item', itemId] })
      queryClient.invalidateQueries({ queryKey: ['shop-item-types', shopId] })
    },
  })
}

// ── Delete mutation ────────────────────────────────────────────

export const useDeleteShopItem = (shopId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, photoPaths }: { itemId: string; photoPaths: string[] }) => {
      if (photoPaths.length > 0) {
        await deleteFromR2('shop-items', photoPaths)
      }
      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', itemId) as unknown as { error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-items', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop-item-types', shopId] })
    },
  })
}

// ── Analytics hook ─────────────────────────────────────────────

interface WishAnalytics {
  totalMatchingWishes: number
  byItemCategory: { id: number; name: string; count: number }[]
  topDemandedBrands: { brandId: string; name: string; count: number; inShop: boolean }[]
}

interface AnalyticsRpcResult {
  total_matching_wishes: number
  by_item_category: { id: number; name: string; count: number }[] | null
  top_demanded_brands: { brand_id: string; name: string; count: number; in_shop: boolean }[] | null
}

export const useShopWishAnalytics = (shopId: string) =>
  useQuery({
    queryKey: ['shop-wish-analytics', shopId],
    queryFn: async () => {
      const { data, error } = (await supabase
        .rpc('get_shop_wish_analytics', { p_shop_id: shopId } as never)) as unknown as {
          data: AnalyticsRpcResult | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      if (!data) return null

      return {
        totalMatchingWishes: data.total_matching_wishes ?? 0,
        byItemCategory: (data.by_item_category ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          count: c.count,
        })),
        topDemandedBrands: (data.top_demanded_brands ?? []).map((b) => ({
          brandId: b.brand_id,
          name: b.name,
          count: b.count,
          inShop: b.in_shop,
        })),
      } as WishAnalytics
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  })

export type { WishAnalytics }

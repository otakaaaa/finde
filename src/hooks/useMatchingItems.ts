import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wish, MatchItem } from '@/types'

interface MatchItemRow {
  id: string
  shop_id: string
  name: string
  price: number | null
  size_ids: number[]
  item_type_id: number | null
  brand_id: string | null
  item_types: { id: number; item_category_id: number; name: string } | null
  brands: { id: string; name: string } | null
  shops: { id: string; name: string; status: string; prefecture_id: number | null } | null
  shop_item_photos: { storage_path: string; order: number }[]
}

const MATCH_ITEM_SELECT = `
  id, shop_id, name, price, size_ids, item_type_id, brand_id,
  item_types ( id, item_category_id, name ),
  brands ( id, name ),
  shops!inner ( id, name, status, prefecture_id ),
  shop_item_photos ( storage_path, order )
`.trim()

const fetchMatchingItems = async (wish: Wish): Promise<MatchItem[]> => {
  let query = supabase
    .from('shop_items')
    .select(MATCH_ITEM_SELECT)
    .eq('is_available', true)
    .eq('shops.status', 'public')
    .eq('shops.prefecture_id', wish.prefectureId)

  // 型・ブランドは指定があればサーバー側で絞り込み（厳格）
  if (wish.itemType) query = query.eq('item_type_id', wish.itemType.id)
  if (wish.brandId)  query = query.eq('brand_id', wish.brandId)

  const { data, error } = await query.limit(50) as unknown as {
    data: MatchItemRow[] | null
    error: { message: string } | null
  }

  if (error) throw new Error(error.message)

  const wMin = wish.priceRange.minPrice ?? 0
  const wMax = wish.priceRange.maxPrice ?? Number.MAX_SAFE_INTEGER

  const matched = (data ?? []).filter((row) => {
    if (!row.shops) return false

    // 種別: itemType 未指定で itemCategory 指定時はカテゴリ一致
    if (!wish.itemType && wish.itemCategory) {
      if (row.item_types?.item_category_id !== wish.itemCategory.id) return false
    }

    // サイズ: 指定があれば含むこと（厳格）
    if (wish.sizeId != null && !row.size_ids.includes(wish.sizeId)) return false

    // 価格: アイテムに価格があればウィッシュ価格帯内（null はスキップ）
    if (row.price != null && (row.price < wMin || row.price > wMax)) return false

    return true
  })

  return matched.map((row) => {
    const cover = [...row.shop_item_photos].sort((a, b) => a.order - b.order)[0]
    return {
      id: row.id,
      shopId: row.shop_id,
      shopName: row.shops?.name ?? '',
      name: row.name,
      brandName: row.brands?.name ?? null,
      itemTypeName: row.item_types?.name ?? null,
      price: row.price,
      coverPhotoPath: cover?.storage_path ?? null,
    }
  })
}

export const useMatchingItems = (wish: Wish) =>
  useQuery({
    queryKey: ['matching-items', wish.id, wish.itemType?.id, wish.itemCategory?.id, wish.brandId, wish.sizeId, wish.priceRange.id],
    queryFn: () => fetchMatchingItems(wish),
    staleTime: 5 * 60 * 1000,
    enabled: !!wish.id,
  })

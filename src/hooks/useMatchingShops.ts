import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wish, MatchedShop, PriceRange } from '@/types'

interface MatchShopRow {
  id: string
  name: string
  review_count: number
  average_rating: number | null
  city_id: number | null
  price_range_id: number | null
  areas: { id: number; prefecture: string; city: string; slug: string } | null
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null } | null
  shop_photos: { storage_path: string; order: number }[]
}

const toShopPriceRange = (row: MatchShopRow['price_ranges']): PriceRange | null =>
  row
    ? { id: row.id, label: row.label, minPrice: row.min_price, maxPrice: row.max_price }
    : null

const fetchMatchingShops = async (wish: Wish): Promise<{ tier1: MatchedShop[]; tier2: MatchedShop[] }> => {
  // アイテムタイプ・アイテムカテゴリ・ブランド一致の shop_id をまとめて取得
  const [itemTypeResult, itemCategoryResult, brandResult] = await Promise.all([
    wish.itemType
      ? supabase.from('shop_item_types').select('shop_id').eq('item_type_id', wish.itemType.id) as unknown as Promise<{ data: { shop_id: string }[] | null }>
      : Promise.resolve({ data: null }),

    wish.itemCategory
      ? supabase
          .from('shop_item_types')
          .select('shop_id, item_types!inner(item_category_id)')
          .eq('item_types.item_category_id', wish.itemCategory.id) as unknown as Promise<{ data: { shop_id: string }[] | null }>
      : Promise.resolve({ data: null }),

    wish.brandId
      ? supabase.from('shop_brands').select('shop_id').eq('brand_id', wish.brandId) as unknown as Promise<{ data: { shop_id: string }[] | null }>
      : Promise.resolve({ data: null }),
  ])

  const itemTypeShopIds = itemTypeResult.data
    ? new Set(itemTypeResult.data.map((r) => r.shop_id))
    : null
  const itemCategoryShopIds = itemCategoryResult.data
    ? new Set(itemCategoryResult.data.map((r) => r.shop_id))
    : null
  const brandShopIds = brandResult.data
    ? new Set(brandResult.data.map((r) => r.shop_id))
    : null

  // 都道府県内の公開店舗を取得
  const { data: shopData, error } = await supabase
    .from('shops')
    .select(`
      id, name, review_count, average_rating,
      city_id, price_range_id,
      areas ( id, prefecture, city, slug ),
      price_ranges ( id, label, min_price, max_price ),
      shop_photos ( storage_path, order )
    `)
    .eq('status', 'public')
    .eq('prefecture_id', wish.prefectureId)
    .limit(100) as unknown as { data: MatchShopRow[] | null; error: { message: string } | null }

  if (error) throw new Error(error.message)

  const hasSpecificCriteria = !!(wish.itemType || wish.itemCategory || wish.brandId)

  // スコアリング
  const scored = (shopData ?? []).map((row) => {
    let score = 0
    if (itemTypeShopIds?.has(row.id))     score += 3
    if (brandShopIds?.has(row.id))        score += 3
    if (itemCategoryShopIds?.has(row.id)) score += 2
    if (row.price_range_id === wish.priceRange.id) score += 2
    if (wish.cityId != null && row.city_id === wish.cityId) score += 1
    return { row, score }
  })

  // 特定条件がある場合はスコア0を除外
  const candidates = hasSpecificCriteria
    ? scored.filter((s) => s.score > 0)
    : scored

  candidates.sort((a, b) => b.score - a.score)

  const tier1: MatchedShop[] = []
  const tier2: MatchedShop[] = []

  for (const { row, score } of candidates) {
    const sortedPhotos = [...row.shop_photos].sort((a, b) => a.order - b.order)
    const shop = {
      id: row.id,
      name: row.name,
      area: row.areas,
      priceRange: toShopPriceRange(row.price_ranges),
      averageRating: row.average_rating,
      reviewCount: row.review_count,
      coverPhotoPath: sortedPhotos[0]?.storage_path ?? null,
    }
    const hasBrandMatch = brandShopIds?.has(row.id) ?? false

    if (score >= 3) {
      tier1.push({ shop, tier: 1, hasBrandMatch })
    } else {
      tier2.push({ shop, tier: 2, hasBrandMatch })
    }
  }

  return {
    tier1: tier1.slice(0, 6),
    tier2: tier2.slice(0, 6),
  }
}

export const useMatchingShops = (wish: Wish) =>
  useQuery({
    queryKey: ['matching-shops', wish.id, wish.itemType?.id, wish.itemCategory?.id, wish.brandId],
    queryFn: () => fetchMatchingShops(wish),
    staleTime: 5 * 60 * 1000,
    enabled: !!wish.id,
  })

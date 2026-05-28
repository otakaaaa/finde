import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wish, MatchedShop, PriceRange } from '@/types'

interface MatchShopRow {
  id: string
  name: string
  review_count: number
  average_rating: number | null
  area_id: number | null
  price_range_id: number | null
  areas: { id: number; prefecture: string; city: string; slug: string } | null
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null } | null
  shop_photos: { storage_path: string; order: number }[]
}

const priceOverlaps = (shopRange: PriceRange | null, wishRange: PriceRange): boolean => {
  if (!shopRange) return false
  const sMin = shopRange.minPrice ?? 0
  const sMax = shopRange.maxPrice ?? Number.MAX_SAFE_INTEGER
  const wMin = wishRange.minPrice ?? 0
  const wMax = wishRange.maxPrice ?? Number.MAX_SAFE_INTEGER
  return sMin <= wMax && sMax >= wMin
}

const fetchMatchingShops = async (wish: Wish): Promise<{ tier1: MatchedShop[]; tier2: MatchedShop[] }> => {
  // Step 1: カテゴリ一致の shop_id を取得
  const { data: catData } = await supabase
    .from('shop_categories')
    .select('shop_id')
    .eq('category_id', wish.category.id) as unknown as { data: { shop_id: string }[] | null }

  const categoryShopIds = catData?.map((c) => c.shop_id) ?? []
  if (categoryShopIds.length === 0) return { tier1: [], tier2: [] }

  // Step 2: 同じ都道府県の area_id を取得
  const { data: areaData } = await supabase
    .from('areas')
    .select('id')
    .eq('prefecture', wish.area.prefecture) as unknown as { data: { id: number }[] | null }

  const prefAreaIds = areaData?.map((a) => a.id) ?? []
  if (prefAreaIds.length === 0) return { tier1: [], tier2: [] }

  // Step 3: brand_id が設定されている場合、ブランド一致の shop_id を取得
  let brandShopIdSet: Set<string> | null = null
  if (wish.brandId) {
    const { data: brandData } = await supabase
      .from('shop_brands')
      .select('shop_id')
      .eq('brand_id', wish.brandId) as unknown as { data: { shop_id: string }[] | null }
    brandShopIdSet = new Set(brandData?.map((b) => b.shop_id) ?? [])
  }

  // Step 4: 店舗フェッチ（都道府県内 × カテゴリ一致）
  const { data: shopData, error } = await supabase
    .from('shops')
    .select(`
      id, name, review_count, average_rating,
      area_id, price_range_id,
      areas ( id, prefecture, city, slug ),
      price_ranges ( id, label, min_price, max_price ),
      shop_photos ( storage_path, order )
    `)
    .eq('status', 'public')
    .in('id', categoryShopIds)
    .in('area_id', prefAreaIds)
    .limit(60) as unknown as { data: MatchShopRow[] | null; error: { message: string } | null }

  if (error) throw new Error(error.message)

  // Step 5: クライアントサイドで Tier 分類
  const tier1: MatchedShop[] = []
  const tier2: MatchedShop[] = []

  for (const row of shopData ?? []) {
    const shopPriceRange: PriceRange | null = row.price_ranges
      ? {
          id: row.price_ranges.id,
          label: row.price_ranges.label,
          minPrice: row.price_ranges.min_price,
          maxPrice: row.price_ranges.max_price,
        }
      : null

    const isExactArea = row.area_id === wish.area.id
    const isExactPrice = row.price_range_id === wish.priceRange.id
    const hasBrandMatch = brandShopIdSet !== null ? brandShopIdSet.has(row.id) : false

    const sortedPhotos = [...row.shop_photos].sort((a, b) => a.order - b.order)

    const shop = {
      id: row.id,
      name: row.name,
      area: row.areas,
      priceRange: shopPriceRange,
      averageRating: row.average_rating,
      reviewCount: row.review_count,
      coverPhotoPath: sortedPhotos[0]?.storage_path ?? null,
    }

    if (isExactArea && isExactPrice) {
      tier1.push({ shop, tier: 1, hasBrandMatch })
    } else if (priceOverlaps(shopPriceRange, wish.priceRange)) {
      tier2.push({ shop, tier: 2, hasBrandMatch })
    }
  }

  // ブランド一致を先頭に並べる
  const sortByBrand = (a: MatchedShop, b: MatchedShop) =>
    (b.hasBrandMatch ? 1 : 0) - (a.hasBrandMatch ? 1 : 0)

  return {
    tier1: tier1.sort(sortByBrand).slice(0, 6),
    tier2: tier2.sort(sortByBrand).slice(0, 6),
  }
}

export const useMatchingShops = (wish: Wish) =>
  useQuery({
    queryKey: ['matching-shops', wish.id],
    queryFn: () => fetchMatchingShops(wish),
    staleTime: 5 * 60 * 1000,
    enabled: !!wish.id,
  })

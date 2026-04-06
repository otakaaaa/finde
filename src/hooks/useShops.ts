import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Shop, ShopFilters, Area, PriceRange, Category, Tag, Brand, ShopPhoto } from '@/types'

const PAGE_SIZE = 20

interface ShopRow {
  id: string
  name: string
  name_pending: string | null
  description: string | null
  phone: string | null
  website_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  business_hours: Shop['businessHours']
  closed_days: string[]
  status: string
  review_count: number
  average_rating: number | null
  favorite_count: number
  created_at: string
  updated_at: string
  areas: Area | null
  price_ranges: PriceRange | null
  shop_categories: { categories: Category }[]
  shop_tags: { tags: Tag }[]
  shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
  shop_brands: { brands: Brand }[]
}

const mapShopRow = (row: ShopRow): Shop => ({
  id: row.id,
  name: row.name,
  namePending: row.name_pending,
  description: row.description,
  area: row.areas,
  priceRange: row.price_ranges,
  phone: row.phone,
  websiteUrl: row.website_url,
  instagramUrl: row.instagram_url,
  twitterUrl: row.twitter_url,
  businessHours: row.business_hours,
  closedDays: row.closed_days ?? [],
  status: row.status as Shop['status'],
  categories: row.shop_categories.map((sc) => sc.categories),
  tags: row.shop_tags.map((st) => st.tags),
  brands: row.shop_brands.map((sb) => sb.brands),
  photos: row.shop_photos
    .sort((a, b) => a.order - b.order)
    .map((p): ShopPhoto => ({
      id: p.id,
      shopId: p.shop_id,
      storagePath: p.storage_path,
      order: p.order,
      createdAt: p.created_at,
    })),
  reviewCount: row.review_count,
  averageRating: row.average_rating,
  favoriteCount: row.favorite_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const fetchShops = async ({
  filters,
  cursor,
}: {
  filters: ShopFilters
  cursor: string | null
}) => {
  // Resolve categoryId to shop IDs via shop_categories join table
  let filteredShopIds: string[] | null = null
  if (filters.categoryId !== undefined) {
    const catResult = await supabase
      .from('shop_categories')
      .select('shop_id')
      .eq('category_id', filters.categoryId) as unknown as {
        data: { shop_id: string }[] | null
        error: { message: string } | null
      }
    filteredShopIds = catResult.data?.map((c) => c.shop_id) ?? []
  }

  // Resolve brandId to shop IDs via shop_brands join table
  if (filters.brandId !== undefined) {
    const brandResult = await supabase
      .from('shop_brands')
      .select('shop_id')
      .eq('brand_id', filters.brandId) as unknown as {
        data: { shop_id: string }[] | null
        error: { message: string } | null
      }
    const brandShopIds = brandResult.data?.map((b) => b.shop_id) ?? []
    if (filteredShopIds !== null) {
      const brandSet = new Set(brandShopIds)
      filteredShopIds = filteredShopIds.filter((id) => brandSet.has(id))
    } else {
      filteredShopIds = brandShopIds
    }
  }

  if (filteredShopIds !== null && filteredShopIds.length === 0) {
    return { items: [], pageInfo: { hasNextPage: false, endCursor: null } }
  }

  let query = supabase
    .from('shops')
    .select(`
      id, name, name_pending, description, phone, website_url,
      instagram_url, twitter_url, business_hours, closed_days,
      status, review_count, average_rating, favorite_count,
      created_at, updated_at,
      areas ( id, prefecture, city, slug ),
      price_ranges ( id, label, min_price, max_price ),
      shop_categories ( categories ( id, code, name ) ),
      shop_tags ( tags ( id, name, slug ) ),
      shop_photos ( id, shop_id, storage_path, order, created_at ),
      shop_brands ( brands ( id, name, name_kana, aliases, status, merged_into, submitted_by, created_at ) )
    `)
    .eq('status', 'public')
    .limit(PAGE_SIZE + 1)

  if (filters.prefecture) query = query.eq('areas.prefecture', filters.prefecture)
  if (filters.priceRangeId) query = query.eq('price_range_id', filters.priceRangeId)
  if (filters.query) query = query.ilike('name', `%${filters.query}%`)
  if (filteredShopIds !== null) query = query.in('id', filteredShopIds)

  if (cursor) query = query.gt('created_at', cursor)

  switch (filters.sort) {
    case 'rating':
      query = query.order('average_rating', { ascending: false, nullsFirst: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default: // popular
      query = query.order('favorite_count', { ascending: false })
  }

  const { data, error } = await query as {
    data: ShopRow[] | null
    error: { message: string } | null
  }

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const hasNextPage = rows.length > PAGE_SIZE
  const items = hasNextPage ? rows.slice(0, PAGE_SIZE) : rows

  return {
    items: items.map(mapShopRow),
    pageInfo: {
      hasNextPage,
      endCursor: items.length > 0 ? items[items.length - 1].created_at : null,
    },
  }
}

export const useShops = (filters: ShopFilters) => {
  return useInfiniteQuery({
    queryKey: ['shops', filters],
    queryFn: ({ pageParam }) => fetchShops({ filters, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
  })
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Shop } from '@/types'

interface SearchResultRow {
  id: string
  name: string
  description: string | null
  review_count: number
  average_rating: number | null
  favorite_count: number
  created_at: string
  updated_at: string
  areas: { id: number; prefecture: string; city: string; slug: string } | null
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null } | null
  shop_categories: { categories: { id: number; code: string; name: string } }[]
  shop_tags: { tags: { id: number; name: string; slug: string } }[]
  shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
  shop_brands: { brands: { id: string; name: string; name_kana: string | null; aliases: string[]; status: string; merged_into: string | null; submitted_by: string | null; created_at: string } }[]
}

const mapSearchResult = (row: SearchResultRow): Shop => ({
  id: row.id,
  name: row.name,
  namePending: null,
  description: row.description,
  prefectureId: null,
  cityId: null,
  address: null,
  area: row.areas
    ? { id: row.areas.id, prefecture: row.areas.prefecture, city: row.areas.city, slug: row.areas.slug }
    : null,
  priceRange: row.price_ranges
    ? { id: row.price_ranges.id, label: row.price_ranges.label, minPrice: row.price_ranges.min_price, maxPrice: row.price_ranges.max_price }
    : null,
  phone: null,
  websiteUrl: null,
  instagramUrl: null,
  twitterUrl: null,
  tiktokUrl: null,
  businessHours: null,
  closedDays: [],
  status: 'public',
  categories: row.shop_categories.map((sc) => ({
    id: sc.categories.id,
    code: sc.categories.code as Shop['categories'][number]['code'],
    name: sc.categories.name,
  })),
  tags: row.shop_tags.map((st) => st.tags),
  brands: row.shop_brands.map((sb) => ({
    id: sb.brands.id,
    name: sb.brands.name,
    nameKana: sb.brands.name_kana,
    aliases: sb.brands.aliases,
    status: sb.brands.status as 'active' | 'merged',
    mergedInto: sb.brands.merged_into,
    submittedBy: sb.brands.submitted_by,
    createdAt: sb.brands.created_at,
  })),
  photos: row.shop_photos.map((p) => ({
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

export const useShopSearch = (query: string) => {
  return useQuery({
    queryKey: ['shop-search', query],
    queryFn: async () => {
      if (!query.trim()) return []

      const { data, error } = await supabase.rpc('search_shops', {
        search_query: query,
      } as never) as unknown as { data: SearchResultRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapSearchResult)
    },
    enabled: query.trim().length >= 2,
  })
}

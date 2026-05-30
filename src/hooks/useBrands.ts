import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Brand, Shop, ShopPhoto } from '@/types'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  aliases: string[]
  status: 'active' | 'merged'
}

interface BrandDetailRow extends BrandRow {
  merged_into: string | null
  submitted_by: string | null
  created_at: string
}

interface ShopForBrandRow {
  id: string
  name: string
  name_pending: string | null
  description: string | null
  phone: string | null
  website_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  tiktok_url: string | null
  business_hours: Shop['businessHours']
  closed_days: string[]
  status: string
  review_count: number
  average_rating: number | null
  favorite_count: number
  prefecture_id: number | null
  city_id: number | null
  address: string | null
  created_at: string
  updated_at: string
  areas: { id: number; prefecture: string; city: string; slug: string } | null
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null } | null
  shop_categories: { categories: { id: number; code: string; name: string } }[]
  shop_tags: { tags: { id: number; name: string; slug: string } }[]
  shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
  shop_brands: { brands: { id: string; name: string; name_kana: string | null; aliases: string[]; status: string; merged_into: string | null; submitted_by: string | null; created_at: string } }[]
}

const SHOP_SELECT = `
  id, name, name_pending, description, phone, website_url,
  instagram_url, twitter_url, tiktok_url, business_hours, closed_days,
  status, review_count, average_rating, favorite_count,
  prefecture_id, city_id, address, created_at, updated_at,
  areas ( id, prefecture, city, slug ),
  price_ranges ( id, label, min_price, max_price ),
  shop_categories ( categories ( id, code, name ) ),
  shop_tags ( tags ( id, name, slug ) ),
  shop_photos ( id, shop_id, storage_path, order, created_at ),
  shop_brands ( brands ( id, name, name_kana, aliases, status, merged_into, submitted_by, created_at ) )
`

const mapBrand = (b: BrandRow): Brand => ({
  id: b.id,
  name: b.name,
  nameKana: b.name_kana,
  aliases: b.aliases,
  status: b.status,
  mergedInto: null,
  submittedBy: null,
  createdAt: '',
})

const mapShopForBrand = (row: ShopForBrandRow): Shop => ({
  id: row.id,
  name: row.name,
  namePending: row.name_pending,
  description: row.description,
  prefectureId: row.prefecture_id,
  cityId: row.city_id,
  address: row.address,
  area: row.areas ?? null,
  priceRange: row.price_ranges
    ? { id: row.price_ranges.id, label: row.price_ranges.label, minPrice: row.price_ranges.min_price, maxPrice: row.price_ranges.max_price }
    : null,
  phone: row.phone,
  websiteUrl: row.website_url,
  instagramUrl: row.instagram_url,
  twitterUrl: row.twitter_url,
  tiktokUrl: row.tiktok_url,
  businessHours: row.business_hours,
  closedDays: row.closed_days ?? [],
  status: row.status as Shop['status'],
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

export const useBrands = () =>
  useQuery({
    queryKey: ['brands-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status')
        .eq('status', 'active')
        .order('name') as unknown as { data: BrandRow[] | null; error: unknown }
      return (data ?? []).map(mapBrand)
    },
    staleTime: 10 * 60 * 1000,
  })

export const useBrand = (id: string) =>
  useQuery({
    queryKey: ['brand', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status, merged_into, submitted_by, created_at')
        .eq('id', id)
        .single() as unknown as { data: BrandDetailRow | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      if (!data) throw new Error('ブランドが見つかりません')
      return {
        id: data.id,
        name: data.name,
        nameKana: data.name_kana,
        aliases: data.aliases,
        status: data.status,
        mergedInto: data.merged_into,
        submittedBy: data.submitted_by,
        createdAt: data.created_at,
      } satisfies Brand
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })

export const useShopsByBrand = (brandId: string) =>
  useQuery({
    queryKey: ['shops-by-brand', brandId],
    queryFn: async () => {
      const { data: brandShops } = await supabase
        .from('shop_brands')
        .select('shop_id')
        .eq('brand_id', brandId) as unknown as { data: { shop_id: string }[] | null; error: unknown }

      const shopIds = (brandShops ?? []).map((b) => b.shop_id)
      if (shopIds.length === 0) return []

      const { data, error } = await supabase
        .from('shops')
        .select(SHOP_SELECT)
        .eq('status', 'public')
        .in('id', shopIds)
        .order('favorite_count', { ascending: false }) as unknown as {
          data: ShopForBrandRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapShopForBrand)
    },
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
  })

export const useSearchBrands = (committedQuery: string) =>
  useQuery({
    queryKey: ['brands-search', committedQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status')
        .eq('status', 'active')
        .ilike('name', `%${committedQuery}%`)
        .order('name')
        .limit(10) as unknown as { data: BrandRow[] | null; error: unknown }
      return (data ?? []).map(mapBrand)
    },
    enabled: committedQuery.trim().length >= 1,
    staleTime: 30 * 1000,
  })


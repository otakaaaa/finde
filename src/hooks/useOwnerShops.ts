import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Shop, BusinessHours } from '@/types'

interface OwnerShopRow {
  shop_id: string
  shops: {
    id: string
    name: string
    name_pending: string | null
    description: string | null
    phone: string | null
    website_url: string | null
    instagram_url: string | null
    twitter_url: string | null
    tiktok_url: string | null
    business_hours: BusinessHours | null
    closed_days: string[]
    status: string
    review_count: number
    average_rating: number | null
    favorite_count: number
    created_at: string
    updated_at: string
    prefecture_id: number | null
    city_id: number | null
    address: string | null
    areas: { id: number; prefecture: string; city: string; slug: string } | null
    price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null } | null
  }
}

export const useOwnerShops = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['owner-shops', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('shop_staffs')
        .select(`
          shop_id,
          shops (
            id, name, name_pending, description, phone, website_url,
            instagram_url, twitter_url, tiktok_url, business_hours, closed_days,
            status, review_count, average_rating, favorite_count,
            prefecture_id, city_id, address, created_at, updated_at,
            areas ( id, prefecture, city, slug ),
            price_ranges ( id, label, min_price, max_price )
          )
        `)
        .eq('user_id', user.id) as { data: OwnerShopRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)

      return (data ?? []).map(({ shops: s }) => ({
        id: s.id,
        name: s.name,
        namePending: s.name_pending,
        description: s.description,
        prefectureId: s.prefecture_id,
        cityId: s.city_id,
        address: s.address,
        area: s.areas,
        priceRange: s.price_ranges
          ? { id: s.price_ranges.id, label: s.price_ranges.label, minPrice: s.price_ranges.min_price, maxPrice: s.price_ranges.max_price }
          : null,
        phone: s.phone,
        websiteUrl: s.website_url,
        instagramUrl: s.instagram_url,
        twitterUrl: s.twitter_url,
        tiktokUrl: s.tiktok_url,
        businessHours: s.business_hours,
        closedDays: s.closed_days ?? [],
        status: s.status as Shop['status'],
        categories: [],
        tags: [],
        brands: [],
        photos: [],
        reviewCount: s.review_count,
        averageRating: s.average_rating,
        favoriteCount: s.favorite_count,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })) as Shop[]
    },
    enabled: !!user,
  })
}

interface ShopUpdateInput {
  shopId: string
  name?: string
  description?: string
  prefectureId?: number
  cityId?: number | null
  address?: string
  priceRangeId?: number | null
  categoryIds?: number[]
  phone?: string
  websiteUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  tiktokUrl?: string
  businessHours?: BusinessHours
  closedDays?: string[]
}

export const useUpdateShop = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ shopId, categoryIds, ...updates }: ShopUpdateInput) => {
      const { error } = await supabase
        .from('shops')
        .update({
          ...(updates.name !== undefined && { name: updates.name }),
          description: updates.description,
          ...(updates.prefectureId !== undefined && { prefecture_id: updates.prefectureId }),
          ...(updates.cityId !== undefined && { city_id: updates.cityId ?? null }),
          address: updates.address || null,
          ...(updates.priceRangeId !== undefined && { price_range_id: updates.priceRangeId ?? null }),
          phone: updates.phone || null,
          website_url: updates.websiteUrl || null,
          instagram_url: updates.instagramUrl || null,
          twitter_url: updates.twitterUrl || null,
          tiktok_url: updates.tiktokUrl || null,
          business_hours: updates.businessHours ?? null,
          closed_days: updates.closedDays ?? [],
        } as never)
        .eq('id', shopId) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)

      if (categoryIds !== undefined) {
        const { error: delError } = await supabase
          .from('shop_categories')
          .delete()
          .eq('shop_id', shopId) as unknown as { error: { message: string } | null }

        if (delError) throw new Error(delError.message)

        if (categoryIds.length > 0) {
          const { error: insError } = await supabase
            .from('shop_categories')
            .insert(categoryIds.map((id) => ({ shop_id: shopId, category_id: id })) as never) as unknown as { error: { message: string } | null }

          if (insError) throw new Error(insError.message)
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner-shops', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] })
    },
  })
}

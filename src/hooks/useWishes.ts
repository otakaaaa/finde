import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Wish, WishFormValues, SizeGroup } from '@/types'

interface WishRow {
  id: string
  user_id: string
  type: string
  item_category_id: number | null
  item_type_id: number | null
  size_id: number | null
  tags: string[]
  note: string | null
  is_public: boolean
  notify_email: boolean
  status: 'active' | 'closed'
  brand_id: string | null
  created_at: string
  updated_at: string
  prefecture_id: number
  city_id: number | null
  categories: { id: number; code: string; name: string }
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null }
  prefectures: { id: number; name: string } | null
  cities: { id: number; name: string } | null
  brands: { id: string; name: string } | null
  item_categories: { id: number; code: string; name: string; order: number; size_group: string } | null
  item_types: { id: number; item_category_id: number; code: string; name: string; order: number } | null
  sizes: { id: number; code: string; label: string; size_group: string; order: number } | null
}

const mapWishRow = (row: WishRow): Wish => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as Wish['type'],
  category: { id: row.categories.id, code: row.categories.code as Wish['category']['code'], name: row.categories.name },
  itemCategory: row.item_categories
    ? { id: row.item_categories.id, code: row.item_categories.code, name: row.item_categories.name, order: row.item_categories.order, sizeGroup: row.item_categories.size_group as SizeGroup }
    : null,
  itemType: row.item_types
    ? { id: row.item_types.id, itemCategoryId: row.item_types.item_category_id, code: row.item_types.code, name: row.item_types.name, order: row.item_types.order }
    : null,
  priceRange: { id: row.price_ranges.id, label: row.price_ranges.label, minPrice: row.price_ranges.min_price, maxPrice: row.price_ranges.max_price },
  prefectureId: row.prefecture_id,
  prefecture: row.prefectures ?? null,
  cityId: row.city_id,
  city: row.cities ?? null,
  sizeId: row.size_id,
  size: row.sizes ? { id: row.sizes.id, code: row.sizes.code, label: row.sizes.label, sizeGroup: row.sizes.size_group as SizeGroup, order: row.sizes.order } : null,
  tags: row.tags ?? [],
  note: row.note,
  isPublic: row.is_public,
  notifyEmail: row.notify_email,
  status: row.status,
  brandId: row.brand_id,
  brand: row.brands ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const WISH_SELECT = `
  id, user_id, type, item_category_id, item_type_id,
  size_id, tags,
  note, is_public, notify_email, status, brand_id,
  created_at, updated_at,
  prefecture_id, city_id,
  categories ( id, code, name ),
  price_ranges ( id, label, min_price, max_price ),
  prefectures ( id, name ),
  cities ( id, name ),
  brands ( id, name ),
  item_categories ( id, code, name, order, size_group ),
  item_types ( id, item_category_id, code, name, order ),
  sizes ( id, code, label, size_group, order )
`

export const useMyWishes = (status: 'active' | 'closed' = 'active') => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['wishes', user?.id, status],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('wishes')
        .select(WISH_SELECT)
        .eq('user_id', user.id)
        .eq('status', status)
        .order('created_at', { ascending: false }) as {
          data: WishRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapWishRow)
    },
    enabled: !!user,
  })
}

export const useCreateWish = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: WishFormValues) => {
      if (!user) throw new Error('ログインが必要です')

      const { error } = await supabase.from('wishes').insert({
        user_id: user.id,
        type: values.type,
        category_id: values.categoryId,
        item_category_id: values.itemCategoryId ?? null,
        item_type_id: values.itemTypeId ?? null,
        price_range_id: values.priceRangeId,
        prefecture_id: values.prefectureId,
        city_id: values.cityId,
        size_id: values.sizeId ?? null,
        tags: values.tags ?? [],
        note: values.note ?? null,
        is_public: values.isPublic,
        notify_email: values.notifyEmail,
        brand_id: values.brandId ?? null,
        status: 'active',
      } as never) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes', user?.id] })
    },
  })
}

export const useWish = (id: string | undefined) => {
  return useQuery({
    queryKey: ['wish', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('wishes')
        .select(WISH_SELECT)
        .eq('id', id)
        .single() as {
          data: WishRow | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      if (!data) return null
      return mapWishRow(data)
    },
    enabled: !!id,
  })
}

export const useUpdateWish = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: WishFormValues }) => {
      const { error } = await supabase.from('wishes').update({
        type: values.type,
        category_id: values.categoryId,
        item_category_id: values.itemCategoryId ?? null,
        item_type_id: values.itemTypeId ?? null,
        price_range_id: values.priceRangeId,
        prefecture_id: values.prefectureId,
        city_id: values.cityId,
        size_id: values.sizeId ?? null,
        tags: values.tags ?? [],
        note: values.note ?? null,
        is_public: values.isPublic,
        notify_email: values.notifyEmail,
        brand_id: values.brandId ?? null,
      } as never).eq('id', id) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['wishes', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['wish', id] })
    },
  })
}

export const useDeleteWish = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (wishId: string) => {
      const { error } = await supabase.from('wishes').delete().eq('id', wishId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes', user?.id] })
    },
  })
}

export const useCloseWish = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (wishId: string) => {
      const { error } = await supabase
        .from('wishes')
        .update({ status: 'closed', updated_at: new Date().toISOString() } as never)
        .eq('id', wishId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes', user?.id] })
    },
  })
}

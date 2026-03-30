import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Wish, WishFormValues } from '@/types'

interface WishRow {
  id: string
  user_id: string
  type: string
  size: string | null
  tags: string[]
  condition: string | null
  urgency: string | null
  note: string | null
  is_public: boolean
  notify_email: boolean
  created_at: string
  updated_at: string
  categories: { id: number; code: string; name: string }
  price_ranges: { id: number; label: string; min_price: number | null; max_price: number | null }
  areas: { id: number; prefecture: string; city: string; slug: string }
}

const mapWishRow = (row: WishRow): Wish => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as Wish['type'],
  category: { id: row.categories.id, code: row.categories.code as Wish['category']['code'], name: row.categories.name },
  priceRange: { id: row.price_ranges.id, label: row.price_ranges.label, minPrice: row.price_ranges.min_price, maxPrice: row.price_ranges.max_price },
  area: { id: row.areas.id, prefecture: row.areas.prefecture, city: row.areas.city, slug: row.areas.slug },
  size: row.size,
  tags: row.tags ?? [],
  condition: row.condition as Wish['condition'],
  urgency: row.urgency as Wish['urgency'],
  note: row.note,
  isPublic: row.is_public,
  notifyEmail: row.notify_email,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const useMyWishes = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['wishes', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('wishes')
        .select(`
          id, user_id, type, size, tags, condition, urgency,
          note, is_public, notify_email, created_at, updated_at,
          categories ( id, code, name ),
          price_ranges ( id, label, min_price, max_price ),
          areas ( id, prefecture, city, slug )
        `)
        .eq('user_id', user.id)
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
        price_range_id: values.priceRangeId,
        area_id: values.areaId,
        size: values.size ?? null,
        tags: values.tags ?? [],
        condition: values.condition ?? null,
        urgency: values.urgency ?? null,
        note: values.note ?? null,
        is_public: values.isPublic,
        notify_email: values.notifyEmail,
      } as never) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes', user?.id] })
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

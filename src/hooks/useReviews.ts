import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Review } from '@/types'

interface ReviewRow {
  id: string
  shop_id: string
  user_id: string
  body: string
  rating: number
  status: string
  ng_score: number
  created_at: string
  updated_at: string
  users: { id: string; display_name: string | null; avatar_url: string | null }
  review_photos: { id: string; review_id: string; storage_path: string; created_at: string }[]
}

const mapReviewRow = (row: ReviewRow): Review => ({
  id: row.id,
  shopId: row.shop_id,
  userId: row.user_id,
  user: {
    id: row.users.id,
    displayName: row.users.display_name,
    avatarUrl: row.users.avatar_url,
  },
  body: row.body,
  rating: row.rating,
  status: row.status as Review['status'],
  ngScore: row.ng_score,
  photos: row.review_photos.map((p) => ({
    id: p.id,
    reviewId: p.review_id,
    storagePath: p.storage_path,
    createdAt: p.created_at,
  })),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const useReviews = (shopId: string) => {
  return useQuery({
    queryKey: ['reviews', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, shop_id, user_id, body, rating, status, ng_score,
          created_at, updated_at,
          users ( id, display_name, avatar_url ),
          review_photos ( id, review_id, storage_path, created_at )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'published')
        .order('created_at', { ascending: false }) as {
          data: ReviewRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapReviewRow)
    },
    enabled: !!shopId,
  })
}

export const useMyReview = (shopId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-review', shopId, user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data } = await supabase
        .from('reviews')
        .select(`
          id, shop_id, user_id, body, rating, status, ng_score,
          created_at, updated_at,
          users ( id, display_name, avatar_url ),
          review_photos ( id, review_id, storage_path, created_at )
        `)
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .maybeSingle() as { data: ReviewRow | null; error: unknown }

      return data ? mapReviewRow(data) : null
    },
    enabled: !!user && !!shopId,
  })
}

interface ReviewInput {
  shopId: string
  body: string
  rating: number
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ shopId, body, rating }: ReviewInput) => {
      if (!user) throw new Error('ログインが必要です')

      const { error } = await supabase
        .from('reviews')
        .upsert(
          { shop_id: shopId, user_id: user.id, body, rating, status: 'published' } as never,
          { onConflict: 'shop_id,user_id' }
        ) as unknown as { data: unknown; error: { message: string } | null }

      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.shopId] })
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] })
    },
  })
}

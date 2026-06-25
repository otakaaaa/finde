import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export const useFavoritesCount = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorites-count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (error) throw new Error(error.message)
      return count ?? 0
    },
    enabled: !!user,
  })
}

export const useFavoriteStatus = (shopId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorite', shopId, user?.id],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null; error: unknown }
      return !!data
    },
    enabled: !!user,
  })
}

export const useToggleFavorite = (shopId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (isFavorited: boolean) => {
      if (!user) throw new Error('ログインが必要です')

      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('shop_id', shopId)
          .eq('user_id', user.id)
      } else {
        await supabase.from('favorites').insert({ shop_id: shopId, user_id: user.id } as never)
      }
    },
    onMutate: async (isFavorited) => {
      await queryClient.cancelQueries({ queryKey: ['favorite', shopId, user?.id] })
      const previous = queryClient.getQueryData<boolean>(['favorite', shopId, user?.id])
      queryClient.setQueryData(['favorite', shopId, user?.id], !isFavorited)
      return { previous }
    },
    onError: (_err, _isFavorited, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['favorite', shopId, user?.id], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite', shopId] })
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['favorites-count', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    },
  })
}

interface FavoriteShopRow {
  id: string
  shop_id: string
  created_at: string
  shops: {
    id: string
    name: string
    favorite_count: number
    areas: { id: number; prefecture: string; city: string; slug: string } | null
    shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
  }
}

export const useFavoriteShops = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id, shop_id, created_at,
          shops (
            id, name, favorite_count,
            areas ( id, prefecture, city, slug ),
            shop_photos ( id, shop_id, storage_path, order, created_at )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as {
          data: FavoriteShopRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!user,
  })
}

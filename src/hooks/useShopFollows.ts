import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/** 自分がフォロー中の店舗数 */
export const useFollowsCount = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shop-follows-count', user?.id],
    queryFn: async () => {
      if (!user) return 0
      const { count, error } = await supabase
        .from('shop_follows')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (error) throw new Error(error.message)
      return count ?? 0
    },
    enabled: !!user,
  })
}

/** 指定店舗をフォローしているか */
export const useFollowStatus = (shopId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shop-follow', shopId, user?.id],
    queryFn: async () => {
      if (!user) return false
      const { data } = await supabase
        .from('shop_follows')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .maybeSingle() as { data: { id: string } | null; error: unknown }
      return !!data
    },
    enabled: !!user,
  })
}

/** フォロー/フォロー解除（楽観的更新つき） */
export const useToggleFollow = (shopId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (isFollowing: boolean) => {
      if (!user) throw new Error('ログインが必要です')

      if (isFollowing) {
        await supabase
          .from('shop_follows')
          .delete()
          .eq('shop_id', shopId)
          .eq('user_id', user.id)
      } else {
        await supabase.from('shop_follows').insert({ shop_id: shopId, user_id: user.id } as never)
      }
    },
    onMutate: async (isFollowing) => {
      await queryClient.cancelQueries({ queryKey: ['shop-follow', shopId, user?.id] })
      const previous = queryClient.getQueryData<boolean>(['shop-follow', shopId, user?.id])
      queryClient.setQueryData(['shop-follow', shopId, user?.id], !isFollowing)
      return { previous }
    },
    onError: (_err, _isFollowing, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['shop-follow', shopId, user?.id], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-follow', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop-follows', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['shop-follows-count', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    },
  })
}

interface FollowedShopRow {
  id: string
  shop_id: string
  created_at: string
  shops: {
    id: string
    name: string
    follower_count: number
    areas: { id: number; prefecture: string; city: string; slug: string } | null
    shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
  }
}

/** フォロー中の店舗一覧（新しい順） */
export const useFollowedShops = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['shop-follows', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('shop_follows')
        .select(`
          id, shop_id, created_at,
          shops (
            id, name, follower_count,
            areas ( id, prefecture, city, slug ),
            shop_photos ( id, shop_id, storage_path, order, created_at )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as {
          data: FollowedShopRow[] | null
          error: { message: string } | null
        }

      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!user,
  })
}

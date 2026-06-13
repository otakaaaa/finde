import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * 指定した店舗にオーナー(shop_staffs.staff_role = 'owner')が紐づいているかを返す。
 * shop_staffs は RLS で本人 / 管理者しか読めないため、SECURITY DEFINER の
 * RPC `shop_has_owner` を経由して真偽値のみを取得する。
 */
export const useShopHasOwner = (shopId: string) =>
  useQuery({
    queryKey: ['shop-has-owner', shopId],
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('shop_has_owner', {
        p_shop_id: shopId,
      } as never) as unknown as { data: boolean | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data ?? false
    },
  })

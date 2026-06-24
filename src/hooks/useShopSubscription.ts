import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { OWNER_PREMIUM_ENABLED } from '@/config/ownerPremium'

/**
 * 店舗（オーナー）単位の有料プラン契約状況を取得する。
 *
 * subscriptions テーブルのうち shop_id を持つ行がオーナー向け契約。
 * status が active / trialing のものを有効な契約とみなす。
 *
 * 課金導線が未実装の現時点では有効な契約行は存在しないため、
 * すべてのオーナーが isPremium = false（＝無料）となる。
 */
export const useShopSubscription = (shopId: string | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['shop-subscription', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('shop_id', shopId!)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data as { status: string } | null
    },
    enabled: !!shopId,
  })

  // ゲーティングが無効なら全オーナーをプレミアム扱い（全開放）
  const isPremium = !OWNER_PREMIUM_ENABLED || data != null

  return {
    isPremium,
    isLoading,
    error,
  }
}

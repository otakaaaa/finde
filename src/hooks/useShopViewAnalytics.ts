import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ShopViewAnalytics } from '@/types'

// ── RPC row types ──────────────────────────────────────────────

interface TotalsRpc {
  pv: number
  uu: number
}

export interface AnalyticsRpcResult {
  daily: { date: string; pv: number; uu: number }[] | null
  totals: TotalsRpc | null
  prev_totals: TotalsRpc | null
  by_source: { source: string; count: number }[] | null
  actions: { type: string; count: number }[] | null
  follows: number | null
  top_items: { itemId: string; name: string; count: number }[] | null
  by_hour: { hour: number; count: number }[] | null
  by_weekday: { weekday: number; count: number }[] | null
}

const EMPTY_TOTALS = { pv: 0, uu: 0 }

export const mapResult = (data: AnalyticsRpcResult): ShopViewAnalytics => ({
  daily: data.daily ?? [],
  totals: data.totals ?? EMPTY_TOTALS,
  prevTotals: data.prev_totals ?? EMPTY_TOTALS,
  bySource: data.by_source ?? [],
  actions: data.actions ?? [],
  follows: data.follows ?? 0,
  topItems: data.top_items ?? [],
  byHour: data.by_hour ?? [],
  byWeekday: data.by_weekday ?? [],
})

export const useShopViewAnalytics = (
  shopId: string,
  days: number,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ['shop-view-analytics', shopId, days],
    queryFn: async () => {
      const { data, error } = (await supabase.rpc('get_shop_view_analytics', {
        p_shop_id: shopId,
        p_days: days,
      } as never)) as unknown as {
        data: AnalyticsRpcResult | null
        error: { message: string } | null
      }
      if (error) throw new Error(error.message)
      if (!data) return null
      return mapResult(data)
    },
    enabled: !!shopId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  })

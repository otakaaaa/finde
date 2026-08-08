import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  generateDateSeries,
  groupByDay,
  toChartData,
  sumValues,
  snapshotsToAllChartData,
  type DateRange,
  type ChartPoint,
  type SnapshotMetrics,
  type SnapshotAllChartData,
} from '@/lib/analyticsUtils'

interface QueryOptions {
  enabled?: boolean
}

function startDateISO(days: DateRange): string {
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── ユーザー登録 ──────────────────────────────────────────────

export interface UserRegistrationData {
  chartData: ChartPoint[]
  total: number
}

export const useUserRegistrations = (days: DateRange, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ['analytics-users', days],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<UserRegistrationData> => {
      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDateISO(days)) as unknown as {
          data: { created_at: string }[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      const series = generateDateSeries(days)
      const map = groupByDay(data ?? [])
      return { chartData: toChartData(series, { users: map }), total: sumValues(map) }
    },
    staleTime: 5 * 60 * 1000,
  })

// ── 店舗追加 ─────────────────────────────────────────────────

export interface ShopAdditionData {
  chartData: ChartPoint[]
  total: number
}

export const useShopAdditions = (days: DateRange, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ['analytics-shops', days],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ShopAdditionData> => {
      const { data, error } = await supabase
        .from('shops')
        .select('created_at')
        .eq('status', 'public')
        .gte('created_at', startDateISO(days)) as unknown as {
          data: { created_at: string }[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      const series = generateDateSeries(days)
      const map = groupByDay(data ?? [])
      return { chartData: toChartData(series, { shops: map }), total: sumValues(map) }
    },
    staleTime: 5 * 60 * 1000,
  })

// ── 掲載申請パイプライン ──────────────────────────────────────

export interface ListingRequestData {
  chartData: ChartPoint[]
  totals: { pending: number; approved: number; rejected: number }
}

export const useListingRequests = (days: DateRange, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ['analytics-listing-requests', days],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<ListingRequestData> => {
      const { data, error } = await supabase
        .from('shop_listing_requests')
        .select('created_at, status')
        .gte('created_at', startDateISO(days)) as unknown as {
          data: { created_at: string; status: string }[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      const records = data ?? []
      const series = generateDateSeries(days)
      const pending  = groupByDay(records.filter((r) => r.status === 'pending'))
      const approved = groupByDay(records.filter((r) => r.status === 'approved'))
      const rejected = groupByDay(records.filter((r) => r.status === 'rejected'))
      return {
        chartData: toChartData(series, { pending, approved, rejected }),
        totals: {
          pending:  sumValues(pending),
          approved: sumValues(approved),
          rejected: sumValues(rejected),
        },
      }
    },
    staleTime: 5 * 60 * 1000,
  })

// ── エンゲージメント ──────────────────────────────────────────

export interface EngagementData {
  chartData: ChartPoint[]
  totals: { follows: number; wishes: number }
}

export const useEngagement = (days: DateRange, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ['analytics-engagement', days],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<EngagementData> => {
      const [followsRes, wishesRes] = await Promise.all([
        supabase
          .from('shop_follows')
          .select('created_at')
          .gte('created_at', startDateISO(days)) as unknown as Promise<{
            data: { created_at: string }[] | null
            error: { message: string } | null
          }>,
        supabase
          .from('wishes')
          .select('created_at')
          .gte('created_at', startDateISO(days)) as unknown as Promise<{
            data: { created_at: string }[] | null
            error: { message: string } | null
          }>,
      ])
      if (followsRes.error) throw new Error(followsRes.error.message)
      if (wishesRes.error) throw new Error(wishesRes.error.message)

      const series    = generateDateSeries(days)
      const follows = groupByDay(followsRes.data ?? [])
      const wishes    = groupByDay(wishesRes.data ?? [])
      return {
        chartData: toChartData(series, { follows, wishes }),
        totals: {
          follows: sumValues(follows),
          wishes:    sumValues(wishes),
        },
      }
    },
    staleTime: 5 * 60 * 1000,
  })

// ── サブスクリプション ────────────────────────────────────────

export interface SubscriptionData {
  chartData: ChartPoint[]
  totals: { newSubs: number; canceled: number }
}

export const useSubscriptions = (days: DateRange, options: QueryOptions = {}) =>
  useQuery({
    queryKey: ['analytics-subscriptions', days],
    enabled: options.enabled ?? true,
    queryFn: async (): Promise<SubscriptionData> => {
      const [newRes, canceledRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('created_at')
          .eq('status', 'active')
          .gte('created_at', startDateISO(days)) as unknown as Promise<{
            data: { created_at: string }[] | null
            error: { message: string } | null
          }>,
        supabase
          .from('subscriptions')
          .select('canceled_at')
          .not('canceled_at', 'is', null)
          .gte('canceled_at', startDateISO(days)) as unknown as Promise<{
            data: { canceled_at: string }[] | null
            error: { message: string } | null
          }>,
      ])
      if (newRes.error) throw new Error(newRes.error.message)
      if (canceledRes.error) throw new Error(canceledRes.error.message)

      const series   = generateDateSeries(days)
      const newSubs  = groupByDay(newRes.data ?? [])
      const canceled = groupByDay(
        (canceledRes.data ?? []).map((r) => ({ created_at: r.canceled_at })),
      )
      return {
        chartData: toChartData(series, { newSubs, canceled }),
        totals: { newSubs: sumValues(newSubs), canceled: sumValues(canceled) },
      }
    },
    staleTime: 5 * 60 * 1000,
  })

// ── カスタム期間（スナップショット） ──────────────────────────

export const useCustomRangeAnalytics = (
  startDate: string,
  endDate: string,
  options: QueryOptions = {},
) =>
  useQuery({
    queryKey: ['analytics-custom', startDate, endDate],
    enabled: (options.enabled ?? true) && startDate <= endDate,
    queryFn: async (): Promise<SnapshotAllChartData> => {
      const { data, error } = await supabase
        .from('analytics_daily_snapshots')
        .select('date, metrics')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true }) as unknown as {
          data: { date: string; metrics: SnapshotMetrics }[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return snapshotsToAllChartData(data ?? [])
    },
    staleTime: 10 * 60 * 1000,
  })

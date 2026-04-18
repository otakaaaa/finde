import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Subscription } from '@/types'

interface RawSubscription {
  id: string
  shop_id: string | null
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

const toSubscription = (raw: RawSubscription): Subscription => ({
  id: raw.id,
  shopId: raw.shop_id,
  userId: raw.user_id,
  stripeSubscriptionId: raw.stripe_subscription_id,
  stripeCustomerId: raw.stripe_customer_id,
  plan: raw.plan as Subscription['plan'],
  status: raw.status as Subscription['status'],
  currentPeriodStart: raw.current_period_start,
  currentPeriodEnd: raw.current_period_end,
  canceledAt: raw.canceled_at,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
})

export const useUserSubscription = (userId: string | undefined) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId!)
        .is('shop_id', null)  // ユーザープレミアム会員は shop_id が null
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ? toSubscription(data as RawSubscription) : null
    },
    enabled: !!userId,
  })

  const isPremium =
    data?.status === 'active' || data?.status === 'trialing'

  return {
    subscription: data ?? null,
    isPremium,
    isLoading,
    error,
  }
}

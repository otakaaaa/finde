import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Crown, Check, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUserSubscription } from '@/hooks/useUserSubscription'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan } from '@/types'

const PLAN_FEATURES = {
  free: [
    'お気に入り店舗の保存（10件まで）',
    'ウィッシュ登録（3件まで）',
    '基本検索機能',
  ],
  premium: [
    'お気に入り店舗の保存（無制限）',
    'ウィッシュ登録（無制限）',
    '高度なフィルタ検索',
    '新着店舗の優先通知',
    '広告非表示',
  ],
}

const PLAN_PRICE = {
  monthly: { amount: '¥980', period: '/ 月', label: '月額プラン', note: '' },
  yearly: { amount: '¥9,800', period: '/ 年', label: '年額プラン', note: '2ヶ月分お得' },
}

type PlanToggle = 'monthly' | 'yearly'

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'アクティブ', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    trialing: { label: 'トライアル中', className: 'border-blue-200 bg-blue-50 text-blue-700' },
    past_due: { label: '支払い遅延', className: 'border-red-200 bg-red-50 text-red-700' },
    canceled: { label: 'キャンセル済み', className: 'border-border bg-muted text-muted-foreground' },
  }
  const c = config[status] ?? config['canceled']
  return (
    <span className={cn('inline-block border px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-[0.2em]', c.className)}>
      {c.label}
    </span>
  )
}

const SubscriptionPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { subscription, isPremium, isLoading } = useUserSubscription(user?.id)

  const [selectedPlan, setSelectedPlan] = useState<PlanToggle>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    setActionError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan: selectedPlan as SubscriptionPlan },
      })

      if (error) throw error
      if (!data?.url) throw new Error('Checkout URL が取得できませんでした')

      window.location.href = data.url as string
    } catch (err) {
      const message = err instanceof Error ? err.message : '決済の開始に失敗しました'
      setActionError(message)
      setCheckoutLoading(false)
    }
  }

  const handleManage = async () => {
    setPortalLoading(true)
    setActionError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      })

      if (error) throw error
      if (!data?.url) throw new Error('Portal URL が取得できませんでした')

      window.location.href = data.url as string
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ポータルの開始に失敗しました'
      setActionError(message)
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const nextBillingDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="bg-background">
      {/* ── Header ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-10 pt-10 md:px-16">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end select-none overflow-hidden pr-4 md:pr-10">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(120px, 22vw, 240px)' }}
          >
            PRO
          </span>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-1.5 border border-white/10 px-3 py-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-white/40">
              Premium
            </span>
          </div>

          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
              — Subscription
            </p>
            <h1 className="font-headline text-2xl font-black leading-none tracking-tight text-white md:text-3xl">
              プレミアム会員
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-16">

        {/* ── Success / Cancel banners ──────────────── */}
        {isSuccess && (
          <div className="wish-card-enter mb-8 border-l-[3px] border-l-emerald-400 bg-emerald-50 px-4 py-4">
            <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
              登録完了
            </p>
            <p className="text-[11px] leading-[1.8] text-emerald-600">
              プレミアム会員へのご登録ありがとうございます。サブスクリプションが有効になりました。
            </p>
          </div>
        )}

        {isCanceled && (
          <div className="wish-card-enter mb-8 border-l-[3px] border-l-amber-400 bg-amber-50 px-4 py-3">
            <p className="text-[11px] font-medium text-amber-700">
              決済がキャンセルされました。サブスクリプションは登録されていません。
            </p>
          </div>
        )}

        {/* ── Error ────────────────────────────────── */}
        {actionError && (
          <div className="mb-8 border-l-[3px] border-l-red-400 bg-red-50 px-4 py-3">
            <p className="text-[11px] font-medium text-red-700">{actionError}</p>
          </div>
        )}

        {/* ── Current plan status (Premium users) ────── */}
        {isPremium && subscription && (
          <div className="mb-8 wish-card-enter">
            <div className="mb-5 flex items-baseline gap-3">
              <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                現在のプラン
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="border border-border bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-headline text-[13px] font-black uppercase tracking-[0.1em] text-foreground/80">
                      Premium — {subscription.plan === 'monthly' ? '月額' : '年額'}
                    </p>
                    <StatusBadge status={subscription.status} />
                  </div>
                </div>
              </div>

              {nextBillingDate && subscription.status !== 'canceled' && (
                <p className="text-[11px] text-muted-foreground/60">
                  次回請求日: <span className="font-bold text-foreground/70">{nextBillingDate}</span>
                </p>
              )}

              {subscription.status === 'past_due' && (
                <p className="mt-2 text-[11px] font-medium text-red-600">
                  お支払いに問題があります。下記よりお支払い情報を更新してください。
                </p>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleManage}
                  disabled={portalLoading}
                  className="flex items-center gap-2 bg-primary px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {portalLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ExternalLink className="h-3.5 w-3.5" />
                  }
                  {portalLoading ? '処理中…' : 'プランを管理する'}
                </button>
                <p className="mt-2 text-[10px] text-muted-foreground/40">
                  プラン変更・解約は Stripe Customer Portal で行えます
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Plan comparison ────────────────────────── */}
        <div className="mb-8 wish-card-enter">
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              プラン比較
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Free */}
            <div className="border border-border bg-white p-5">
              <p className="mb-1 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                Free
              </p>
              <p className="mb-4 font-headline text-3xl font-black tracking-tight text-foreground">
                ¥0
              </p>
              <ul className="space-y-2">
                {PLAN_FEATURES.free.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground/70">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isPremium && (
                <div className="mt-5 border border-border px-4 py-2 text-center font-headline text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
                  現在のプラン
                </div>
              )}
            </div>

            {/* Premium */}
            <div className="border-2 border-primary bg-white p-5">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Premium
                </p>
                <Crown className="h-3.5 w-3.5 text-primary/60" />
              </div>

              {!isPremium && (
                <div className="mb-3 flex overflow-hidden border border-border">
                  {(['monthly', 'yearly'] as PlanToggle[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPlan(p)}
                      className={cn(
                        'flex-1 py-1.5 font-headline text-[9px] font-black uppercase tracking-[0.2em] transition-colors',
                        selectedPlan === p
                          ? 'bg-primary text-white'
                          : 'text-muted-foreground/50 hover:text-foreground/70',
                      )}
                    >
                      {p === 'monthly' ? '月額' : '年額'}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-1">
                <span className="font-headline text-3xl font-black tracking-tight text-foreground">
                  {PLAN_PRICE[isPremium ? (subscription?.plan ?? 'monthly') : selectedPlan].amount}
                </span>
                <span className="ml-1 text-[11px] text-muted-foreground/60">
                  {PLAN_PRICE[isPremium ? (subscription?.plan ?? 'monthly') : selectedPlan].period}
                </span>
              </div>
              {PLAN_PRICE[isPremium ? (subscription?.plan ?? 'monthly') : selectedPlan].note && (
                <p className="mb-3 text-[9px] text-primary/70">
                  {PLAN_PRICE[isPremium ? (subscription?.plan ?? 'monthly') : selectedPlan].note}
                </p>
              )}

              <ul className="mb-4 space-y-2">
                {PLAN_FEATURES.premium.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-foreground/70">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              {!isPremium ? (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                  className="flex w-full items-center justify-center gap-2 bg-primary py-3 font-headline text-[10px] font-black uppercase tracking-[0.3em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {checkoutLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Crown className="h-3.5 w-3.5" />
                  }
                  {checkoutLoading ? '処理中…' : 'プレミアムに登録する'}
                </button>
              ) : (
                <div className="border border-primary/30 bg-primary/5 px-4 py-2 text-center font-headline text-[9px] font-black uppercase tracking-[0.25em] text-primary">
                  現在のプラン
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Back link ────────────────────────────── */}
        <button
          type="button"
          onClick={() => navigate('/mypage')}
          className="font-headline text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/35 transition-colors hover:text-foreground/60"
        >
          ← マイページへ戻る
        </button>
      </div>
    </div>
  )
}

export default SubscriptionPage

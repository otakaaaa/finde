import { useParams, Link } from 'react-router'
import { ChevronLeft, TrendingUp, ShoppingBag, CheckCircle, XCircle } from 'lucide-react'
import { useShopWishAnalytics } from '@/hooks/useShopItems'
import { useShopSubscription } from '@/hooks/useShopSubscription'
import { OwnerPremiumLock } from '@/components/owner/OwnerPremiumLock'
import { cn } from '@/lib/utils'

const OwnerWishAnalyticsPage = () => {
  const { shopId } = useParams<{ shopId: string }>()

  const { isPremium, isLoading: isSubLoading } = useShopSubscription(shopId)
  const { data: analytics, isLoading, isError } = useShopWishAnalytics(shopId ?? '', {
    enabled: isPremium,
  })

  if (isSubLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] justify-center bg-background py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPremium) {
    return <OwnerPremiumLock feature="wish-analytics" />
  }

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            ANALYTICS
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              ウィッシュ分析
            </h1>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            同都道府県内の公開ウィッシュデータを集計しています。マッチング改善の参考にしてください。
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 md:px-16 md:py-14">

          {isLoading && (
            <div className="flex justify-center py-24">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {isError && (
            <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">データの取得に失敗しました。</p>
            </div>
          )}

          {!isLoading && !isError && analytics && (
            <>

              {/* ── Total matching ────────────────── */}
              <section>
                <SectionLabel label="マッチング対象ウィッシュ" />
                <div className="border border-border bg-white p-6 editorial-shadow">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-primary/40" />
                    <div>
                      <p className="font-headline text-4xl font-black tabular-nums tracking-tight text-primary">
                        {analytics.totalMatchingWishes.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        件のウィッシュが同都道府県内に存在します
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── By item category ──────────────── */}
              {analytics.byItemCategory.length > 0 && (
                <section>
                  <SectionLabel label="カテゴリ別ウィッシュ数" />
                  <div className="space-y-2">
                    {analytics.byItemCategory.map((cat, idx) => {
                      const maxCount = analytics.byItemCategory[0]?.count ?? 1
                      const widthPct = Math.round((cat.count / maxCount) * 100)
                      return (
                        <div key={cat.id} className="border border-border bg-white p-4 editorial-shadow">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <span className="font-headline text-sm font-black tracking-tight text-foreground/80">
                                {cat.name}
                              </span>
                            </div>
                            <span className="font-headline text-sm font-black tabular-nums text-primary">
                              {cat.count.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-primary/40 transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* ── Top demanded brands ───────────── */}
              {analytics.topDemandedBrands.length > 0 && (
                <section>
                  <SectionLabel label="需要ブランドTOP10" />
                  <p className="mb-4 text-[10px] text-muted-foreground/50">
                    ウィッシュで指定されているブランドのランキングです。緑のチェックは既に取り扱い中です。
                  </p>
                  <div className="space-y-2">
                    {analytics.topDemandedBrands.map((brand, idx) => (
                      <div
                        key={brand.brandId}
                        className={cn(
                          'flex items-center gap-4 border p-4 editorial-shadow',
                          brand.inShop
                            ? 'border-emerald-100 bg-emerald-50/40'
                            : 'border-border bg-white',
                        )}
                      >
                        <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'font-headline text-sm font-black tracking-tight',
                            brand.inShop ? 'text-emerald-800' : 'text-foreground/80',
                          )}>
                            {brand.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-headline text-sm font-black tabular-nums',
                            brand.inShop ? 'text-emerald-600' : 'text-primary',
                          )}>
                            {brand.count.toLocaleString()}
                          </span>
                          {brand.inShop ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/20" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {analytics.topDemandedBrands.some((b) => !b.inShop) && (
                    <div className="mt-4 border border-amber-100 bg-amber-50/50 p-4">
                      <p className="text-[11px] font-bold text-amber-700">
                        <ShoppingBag className="mr-1.5 inline h-3 w-3" />
                        まだ取り扱っていないブランドへの需要があります。
                        <Link to={`/owner/shops/${shopId}/brands`} className="ml-1 underline hover:no-underline">
                          ブランドを追加する →
                        </Link>
                      </p>
                    </div>
                  )}
                </section>
              )}

              {analytics.totalMatchingWishes === 0 && (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground/15" />
                  <p className="text-sm text-muted-foreground/50">
                    まだ同都道府県内に公開ウィッシュがありません
                  </p>
                </div>
              )}

            </>
          )}

        </div>
      </div>
    </div>
  )
}

const SectionLabel = ({ label }: { label: string }) => (
  <div className="mb-4 flex items-baseline gap-3">
    <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
      {label}
    </span>
    <span className="h-px flex-1 bg-border" />
  </div>
)

export default OwnerWishAnalyticsPage

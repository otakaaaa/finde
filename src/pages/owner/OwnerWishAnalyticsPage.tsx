import { useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  ChevronLeft,
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  XCircle,
  Boxes,
} from 'lucide-react'
import { useShopWishAnalytics, type WishCategoryCount } from '@/hooks/useShopItems'
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
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            ANALYTICS
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to="/owner"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">— Owner</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              ウィッシュ分析
            </h1>
          </div>
        </div>
      </section>

      {/* ── Description ────────────────────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            同都道府県内の公開ウィッシュデータを集計しています。
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

              {/* ── 充足率 ────────────────────── */}
              <section>
                <SectionLabel label="充足率" />
                <FulfillmentCard
                  total={analytics.totalMatchingWishes}
                  fulfilled={analytics.fulfilledWishes}
                  shopId={shopId ?? ''}
                />
              </section>

              {/* ── By item category（アイテムタイプ掘り下げ付き） ── */}
              {analytics.byItemCategory.length > 0 && (
                <section>
                  <SectionLabel label="カテゴリ別ウィッシュ数" />
                  <p className="mb-4 text-[10px] text-muted-foreground/50">
                    カテゴリをタップすると、内訳のアイテムタイプ別需要を確認できます。
                  </p>
                  <div className="space-y-2">
                    {analytics.byItemCategory.map((cat, idx) => (
                      <CategoryRow
                        key={cat.id}
                        category={cat}
                        rank={idx + 1}
                        maxCount={analytics.byItemCategory[0]?.count ?? 1}
                      />
                    ))}
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

// ── 充足率カード ───────────────────────────────────────────
const FulfillmentCard = ({
  total,
  fulfilled,
  shopId,
}: {
  total: number
  fulfilled: number
  shopId: string
}) => {
  const safeFulfilled = Math.min(fulfilled, total)
  const unfulfilled = Math.max(total - safeFulfilled, 0)
  const rate = total > 0 ? Math.round((safeFulfilled / total) * 100) : 0

  return (
    <div className="border border-border bg-white p-6 editorial-shadow">
      <div className="flex items-center gap-4">
        <Boxes className="h-8 w-8 shrink-0 text-primary/40" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="font-headline text-4xl font-black tabular-nums tracking-tight text-primary">
              {rate}
              <span className="text-2xl">%</span>
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {total > 0
                ? `同エリアの公開ウィッシュ ${total.toLocaleString()}件中 ${safeFulfilled.toLocaleString()}件 をカバー`
                : '同エリアに公開ウィッシュがまだありません'}
            </p>
          </div>
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${rate}%` }}
            />
          </div>

          {unfulfilled > 0 && (
            <div className="mt-5 border border-amber-100 bg-amber-50/50 p-4">
              <p className="text-[11px] font-bold leading-relaxed text-amber-700">
                <ShoppingBag className="mr-1.5 inline h-3 w-3" />
                未充足のウィッシュが {unfulfilled.toLocaleString()}件 あります。
                取り扱いブランド・サイズ・価格帯を広げると、リーチできる需要が増えます。
                <Link
                  to={`/owner/shops/${shopId}/items`}
                  className="ml-1 underline hover:no-underline"
                >
                  アイテムを追加する →
                </Link>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── カテゴリ行（アイテムタイプ掘り下げ） ───────────────────────
const CategoryRow = ({
  category,
  rank,
  maxCount,
}: {
  category: WishCategoryCount
  rank: number
  maxCount: number
}) => {
  const [expanded, setExpanded] = useState(false)
  const widthPct = Math.round((category.count / maxCount) * 100)
  const hasTypes = category.itemTypes.length > 0
  const typedTotal = category.itemTypes.reduce((sum, t) => sum + t.count, 0)
  const typeUnspecified = Math.max(category.count - typedTotal, 0)

  return (
    <div className="border border-border bg-white editorial-shadow">
      <button
        type="button"
        onClick={() => hasTypes && setExpanded((v) => !v)}
        className={cn('w-full p-4 text-left', hasTypes && 'transition-colors hover:bg-muted/30')}
        aria-expanded={expanded}
        disabled={!hasTypes}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
              {String(rank).padStart(2, '0')}
            </span>
            <span className="font-headline text-sm font-black tracking-tight text-foreground/80">
              {category.name}
            </span>
            {hasTypes && (
              <ChevronLeft
                className={cn(
                  'h-3 w-3 text-muted-foreground/40 transition-transform',
                  expanded ? 'rotate-90' : '-rotate-90',
                )}
              />
            )}
          </div>
          <span className="font-headline text-sm font-black tabular-nums text-primary">
            {category.count.toLocaleString()}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary/40 transition-all"
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </button>

      {expanded && hasTypes && (
        <div className="space-y-2 border-t border-border bg-muted/20 px-4 py-3">
          {category.itemTypes.map((type) => {
            const typeWidth = Math.round((type.count / (category.itemTypes[0]?.count ?? 1)) * 100)
            return (
              <div key={type.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground/70">{type.name}</span>
                  <span className="font-headline text-[11px] font-black tabular-nums text-primary/70">
                    {type.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-0.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary/30"
                    style={{ width: `${typeWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
          {typeUnspecified > 0 && (
            <p className="pt-1 text-[10px] text-muted-foreground/50">
              アイテムタイプ未指定: {typeUnspecified.toLocaleString()}件
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default OwnerWishAnalyticsPage

import { Link } from 'react-router'
import { useMatchingShops } from '@/hooks/useMatchingShops'
import { MatchedShopCard } from '@/components/wish/MatchedShopCard'
import type { Wish, MatchedShop } from '@/types'

const MAX_DISPLAY = 6

const ShopSkeleton = () => (
  <div className="flex items-center gap-3 border border-border bg-white p-2.5">
    <div className="h-14 w-14 shrink-0 animate-pulse rounded-sm bg-muted" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
      <div className="h-2.5 w-1/2 animate-pulse rounded-sm bg-muted" />
    </div>
  </div>
)

interface TierSectionProps {
  label: string
  shops: MatchedShop[]
  wishAreaId: number
  wishPriceRangeId: number
}

const TierSection = ({ label, shops, wishAreaId, wishPriceRangeId }: TierSectionProps) => {
  if (shops.length === 0) return null

  const displayed = shops.slice(0, MAX_DISPLAY)
  const overflow = shops.length - MAX_DISPLAY

  return (
    <div>
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {displayed.map((matched) => (
          <MatchedShopCard key={matched.shop.id} matched={matched} />
        ))}
      </div>
      {overflow > 0 && (
        <Link
          to={`/shops?areaId=${wishAreaId}&priceRangeId=${wishPriceRangeId}`}
          className="mt-2 block text-right text-[10px] font-bold text-primary underline-offset-2 hover:underline"
        >
          他{overflow}件を見る →
        </Link>
      )}
    </div>
  )
}

interface WishMatchPanelProps {
  wish: Wish
}

export const WishMatchPanel = ({ wish }: WishMatchPanelProps) => {
  const { data, isLoading, isError } = useMatchingShops(wish)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-2 w-24 animate-pulse rounded-sm bg-muted" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2].map((i) => <ShopSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-[11px] text-red-500">
        店舗情報の取得に失敗しました
      </p>
    )
  }

  const hasAny = (data?.tier1.length ?? 0) > 0 || (data?.tier2.length ?? 0) > 0

  if (!hasAny) {
    return (
      <p className="text-[11px] text-muted-foreground/50">
        条件に合う店舗は現在登録されていません
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <TierSection
        label="完全マッチ"
        shops={data?.tier1 ?? []}
        wishAreaId={wish.area.id}
        wishPriceRangeId={wish.priceRange.id}
      />
      <TierSection
        label={`${wish.area.prefecture}の候補`}
        shops={data?.tier2 ?? []}
        wishAreaId={wish.area.id}
        wishPriceRangeId={wish.priceRange.id}
      />
    </div>
  )
}

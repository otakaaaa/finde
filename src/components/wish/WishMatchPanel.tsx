import { Link } from 'react-router'
import { useMatchingItems } from '@/hooks/useMatchingItems'
import { MatchedItemCard } from '@/components/wish/MatchedItemCard'
import type { Wish } from '@/types'

const MAX_DISPLAY = 6

const ItemSkeleton = () => (
  <div className="flex items-center gap-3 border border-border bg-white p-2.5">
    <div className="h-14 w-14 shrink-0 animate-pulse rounded-sm bg-muted" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
      <div className="h-2.5 w-1/2 animate-pulse rounded-sm bg-muted" />
    </div>
  </div>
)

interface WishMatchPanelProps {
  wish: Wish
}

export const WishMatchPanel = ({ wish }: WishMatchPanelProps) => {
  const { data, isLoading, isError } = useMatchingItems(wish)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-2 w-24 animate-pulse rounded-sm bg-muted" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[0, 1, 2].map((i) => <ItemSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-[11px] text-red-500">
        アイテム情報の取得に失敗しました
      </p>
    )
  }

  const items = data ?? []

  if (items.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground/50">
        条件に合うアイテムは現在登録されていません
      </p>
    )
  }

  const displayed = items.slice(0, MAX_DISPLAY)
  const overflow = items.length - MAX_DISPLAY

  return (
    <div>
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/40">
        マッチするアイテム
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {displayed.map((item) => (
          <MatchedItemCard key={item.id} item={item} />
        ))}
      </div>
      {overflow > 0 && (
        <Link
          to={`/shops?prefectureId=${wish.prefectureId}`}
          className="mt-2 block text-right text-[10px] font-bold text-primary underline-offset-2 hover:underline"
        >
          他{overflow}件を見る →
        </Link>
      )}
    </div>
  )
}

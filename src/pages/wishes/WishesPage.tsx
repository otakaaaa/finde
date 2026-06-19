import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Trash2, Globe, Lock, Bell, BellOff, Pencil, Check, Store, ChevronDown, ChevronUp } from 'lucide-react'
import { useMyWishes, useDeleteWish, useCloseWish } from '@/hooks/useWishes'
import { WishMatchPanel } from '@/components/wish/WishMatchPanel'
import { cn } from '@/lib/utils'
import type { Wish } from '@/types'

const TYPE_CONFIG: Record<Wish['type'], { label: string; shortLabel: string }> = {
  brand: { label: 'BRAND', shortLabel: 'ブランド' },
  item: { label: 'ITEM', shortLabel: 'アイテム' },
  condition: { label: 'CONDITION', shortLabel: 'コンディション' },
}

const getWishWatermark = (wish: Wish): string =>
  wish.itemCategory ? wish.itemCategory.code.toUpperCase() : TYPE_CONFIG[wish.type].label

const getWishTypeBadge = (wish: Wish): string =>
  wish.itemCategory ? wish.itemCategory.name : TYPE_CONFIG[wish.type].shortLabel

const getWishCategoryBadge = (wish: Wish): string | null => {
  if (wish.itemType) return wish.itemType.name
  if (wish.itemCategory) return null  // itemCategory はステータスバッジで表示済み
  return wish.category.name
}

interface UrgencyConfig {
  label: string
  borderClass: string
  badgeClass: string
}

const URGENCY_CONFIG: Record<NonNullable<Wish['urgency']>, UrgencyConfig> = {
  low: {
    label: '低',
    borderClass: 'border-l-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  medium: {
    label: '中',
    borderClass: 'border-l-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  high: {
    label: '高',
    borderClass: 'border-l-red-400',
    badgeClass: 'bg-red-50 text-red-700',
  },
}

type OverlayState = 'none' | 'delete' | 'close'

const WishCard = ({ wish, index }: { wish: Wish; index: number }) => {
  const { mutate: deleteWish, isPending: isDeletePending } = useDeleteWish()
  const { mutate: closeWish, isPending: isClosePending } = useCloseWish()
  const [overlay, setOverlay] = useState<OverlayState>('none')
  const [matchExpanded, setMatchExpanded] = useState(false)

  const urgencyConf = wish.urgency ? URGENCY_CONFIG[wish.urgency] : null
  const isClosed = wish.status === 'closed'
  const watermark = getWishWatermark(wish)
  const typeBadge = getWishTypeBadge(wish)
  const categoryBadge = getWishCategoryBadge(wish)

  const handleDeleteConfirm = () => {
    deleteWish(wish.id, { onSettled: () => setOverlay('none') })
  }

  const handleCloseConfirm = () => {
    closeWish(wish.id, { onSettled: () => setOverlay('none') })
  }

  return (
    <div
      className={cn(
        'wish-card-enter group relative overflow-hidden border-l-[3px] bg-white editorial-shadow',
        urgencyConf && !isClosed ? urgencyConf.borderClass : 'border-l-border',
        isClosed && 'opacity-70',
      )}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* ── Confirm overlays ────────────────────── */}
      {overlay === 'delete' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/95 px-6 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-red-400" />
            </div>
            <p className="font-headline text-[13px] font-black leading-snug tracking-tight text-foreground">
              このウィッシュを削除しますか？
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">削除後は元に戻せません</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOverlay('none')}
              disabled={isDeletePending}
              className="border border-border px-4 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-foreground/20 disabled:opacity-40"
            >
              キャンセル
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
              className="flex items-center gap-1.5 bg-red-500 px-4 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {isDeletePending && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              削除する
            </button>
          </div>
        </div>
      )}

      {overlay === 'close' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/95 px-6 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-2 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="font-headline text-[13px] font-black leading-snug tracking-tight text-foreground">
              見つかりましたか？
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/50">クローズすると「見つかった」リストに移動します</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOverlay('none')}
              disabled={isClosePending}
              className="border border-border px-4 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-foreground/20 disabled:opacity-40"
            >
              キャンセル
            </button>
            <button
              onClick={handleCloseConfirm}
              disabled={isClosePending}
              className="flex items-center gap-1.5 bg-emerald-500 px-4 py-1.5 text-[11px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {isClosePending && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              見つかった！
            </button>
          </div>
        </div>
      )}

      {/* ── Card watermark ──────────────────────── */}
      <div className="pointer-events-none absolute right-1 top-0 select-none overflow-hidden">
        <span
          className="font-headline font-black leading-none tracking-tighter text-black/[0.03]"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        >
          {watermark}
        </span>
      </div>

      <div className="relative p-4 md:p-5">
        {/* ── Header ──────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {isClosed ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/50">
                <Check className="h-2.5 w-2.5" />
                CLOSED
              </span>
            ) : (
              <span className="inline-flex items-center rounded-sm bg-primary/[0.07] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                {typeBadge}
              </span>
            )}
            {categoryBadge && (
              <span className="inline-flex items-center rounded-sm border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-foreground/70">
                {categoryBadge}
              </span>
            )}
            {urgencyConf && !isClosed && (
              <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold', urgencyConf.badgeClass)}>
                優先度 {urgencyConf.label}
              </span>
            )}
            {wish.brand && (
              <span className="inline-flex items-center rounded-sm bg-foreground/[0.05] px-2 py-0.5 text-[10px] font-bold text-foreground/60">
                {wish.brand.name}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isClosed && (
              <Link
                to={`/wishes/${wish.id}/edit`}
                className="text-muted-foreground/30 transition-colors hover:text-primary group-hover:text-muted-foreground/50"
                title="編集"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              onClick={() => setOverlay('delete')}
              disabled={isDeletePending}
              className="text-muted-foreground/30 transition-colors hover:text-red-500 disabled:opacity-30 group-hover:text-muted-foreground/50"
              title="削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Main attributes ─────────────────────── */}
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-headline text-lg font-black leading-none tracking-tight text-foreground">
            {wish.priceRange.label}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {wish.area.city}
          </span>
          {wish.size && (
            <span className="text-xs text-muted-foreground">/ {wish.size.label}</span>
          )}
        </div>

        {/* ── Note ────────────────────────────────── */}
        {wish.note && (
          <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{wish.note}</p>
        )}

        {/* ── Tags ────────────────────────────────── */}
        {wish.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {wish.tags.map((tag, i) => (
              <span key={i} className="text-[10px] font-medium text-muted-foreground/60">#{tag}</span>
            ))}
          </div>
        )}

        {/* ── Footer ──────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50">
              {wish.isPublic ? (
                <><Globe className="h-3 w-3" />公開中</>
              ) : (
                <><Lock className="h-3 w-3" />非公開</>
              )}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50">
              {wish.notifyEmail ? (
                <><Bell className="h-3 w-3" />通知ON</>
              ) : (
                <><BellOff className="h-3 w-3" />通知OFF</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isClosed && (
              <button
                type="button"
                onClick={() => setOverlay('close')}
                className="flex items-center gap-1 rounded-sm border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-600 transition-colors hover:bg-emerald-50"
              >
                <Check className="h-3 w-3" />
                見つかった
              </button>
            )}
            <button
              type="button"
              onClick={() => setMatchExpanded((v) => !v)}
              className="flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground/60 transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Store className="h-3 w-3" />
              {matchExpanded ? '閉じる' : 'マッチ店舗'}
              {matchExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
            <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">
              {new Date(wish.createdAt).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Match panel ─────────────────────────── */}
      {matchExpanded && (
        <div className="border-t border-border/50 bg-muted/20 px-4 py-4 md:px-5">
          <WishMatchPanel wish={wish} />
        </div>
      )}
    </div>
  )
}

const WishCardSkeleton = ({ index }: { index: number }) => (
  <div
    className="animate-pulse border-l-[3px] border-l-border bg-white editorial-shadow"
    style={{ animationDelay: `${index * 55}ms` }}
  >
    <div className="p-4 md:p-5">
      <div className="mb-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-sm bg-muted" />
        <div className="h-5 w-12 rounded-sm bg-muted" />
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <div className="h-6 w-24 rounded-sm bg-muted" />
        <div className="h-3.5 w-12 rounded-sm bg-muted" />
      </div>
      <div className="mb-1.5 h-3 w-full rounded-sm bg-muted" />
      <div className="h-3 w-3/4 rounded-sm bg-muted" />
      <div className="mt-4 h-3.5 w-1/2 rounded-sm bg-muted" />
    </div>
  </div>
)

const WishesPage = () => {
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed'>('active')
  const { data: wishes, isLoading, isError } = useMyWishes(statusFilter)

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            WANTS
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-end justify-between pb-6">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                — WISHES
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                ウィッシュリスト
              </h1>
            </div>

            <div className="mb-0.5 flex items-center gap-3">
              {!isLoading && wishes && wishes.length > 0 && (
                <span className="font-headline text-[11px] font-black tabular-nums text-white/25">
                  {String(wishes.length).padStart(3, '0')}
                </span>
              )}
              <Link
                to="/wishes/new"
                className="flex h-8 items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-3 text-xs font-bold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                追加する
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Status tabs ──────────────────────────── */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 md:px-16">
          <div className="flex gap-0">
            {([
              { value: 'active', label: '探し中' },
              { value: 'closed', label: '見つかった' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'relative px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors',
                  statusFilter === tab.value
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:content-[\'\']'
                    : 'text-muted-foreground/50 hover:text-foreground/70',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">

          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <WishCardSkeleton key={i} index={i} />
              ))}
            </div>
          )}

          {isError && (
            <div className="border border-border bg-white p-10 text-center">
              <p className="text-sm text-muted-foreground">
                ウィッシュリストの読み込みに失敗しました。再度お試しください。
              </p>
            </div>
          )}

          {!isLoading && !isError && wishes?.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="font-headline font-black text-muted-foreground"
                style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                {statusFilter === 'active' ? '0 WISHES' : '0 CLOSED'}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {statusFilter === 'active'
                  ? '探しているアイテムや条件を登録しましょう'
                  : 'まだ見つかったウィッシュはありません'}
              </p>
              {statusFilter === 'active' && (
                <Link
                  to="/wishes/new"
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ウィッシュを追加する
                </Link>
              )}
            </div>
          )}

          {!isLoading && wishes && wishes.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {wishes.map((wish, i) => (
                <WishCard key={wish.id} wish={wish} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WishesPage

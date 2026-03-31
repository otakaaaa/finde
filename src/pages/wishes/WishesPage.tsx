import { Link } from 'react-router'
import { Plus, Trash2, Globe, Lock, Bell, BellOff, Pencil } from 'lucide-react'
import { useMyWishes, useDeleteWish } from '@/hooks/useWishes'
import { cn } from '@/lib/utils'
import type { Wish } from '@/types'

const TYPE_CONFIG: Record<Wish['type'], { label: string; shortLabel: string }> = {
  brand: { label: 'BRAND', shortLabel: 'ブランド' },
  item: { label: 'ITEM', shortLabel: 'アイテム' },
  condition: { label: 'CONDITION', shortLabel: 'コンディション' },
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

const CONDITION_LABEL: Record<NonNullable<Wish['condition']>, string> = {
  new: '新品',
  used: '中古',
}

const WishCard = ({ wish, index }: { wish: Wish; index: number }) => {
  const { mutate: deleteWish, isPending } = useDeleteWish()
  const typeConf = TYPE_CONFIG[wish.type]
  const urgencyConf = wish.urgency ? URGENCY_CONFIG[wish.urgency] : null

  return (
    <div
      className={cn(
        'wish-card-enter group relative overflow-hidden border-l-[3px] bg-white editorial-shadow',
        urgencyConf ? urgencyConf.borderClass : 'border-l-border',
      )}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Card watermark */}
      <div className="pointer-events-none absolute right-1 top-0 select-none overflow-hidden">
        <span
          className="font-headline font-black leading-none tracking-tighter text-black/[0.03]"
          style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
        >
          {typeConf.label}
        </span>
      </div>

      <div className="relative p-4 md:p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-sm bg-primary/[0.07] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
              {typeConf.shortLabel}
            </span>
            <span className="inline-flex items-center rounded-sm border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-foreground/70">
              {wish.category.name}
            </span>
            {urgencyConf && (
              <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold', urgencyConf.badgeClass)}>
                優先度 {urgencyConf.label}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/wishes/${wish.id}/edit`}
              className="text-muted-foreground/30 transition-colors hover:text-primary group-hover:text-muted-foreground/50"
              title="編集"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => deleteWish(wish.id)}
              disabled={isPending}
              className="text-muted-foreground/30 transition-colors hover:text-red-500 disabled:opacity-30 group-hover:text-muted-foreground/50"
              title="削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main attributes */}
        <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-headline text-lg font-black leading-none tracking-tight text-foreground">
            {wish.priceRange.label}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {wish.area.city}
          </span>
          {wish.size && (
            <span className="text-xs text-muted-foreground">
              / {wish.size}
            </span>
          )}
          {wish.condition && (
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {CONDITION_LABEL[wish.condition]}
            </span>
          )}
        </div>

        {/* Note */}
        {wish.note && (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {wish.note}
          </p>
        )}

        {/* Tags */}
        {wish.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {wish.tags.map((tag, i) => (
              <span key={i} className="text-[10px] font-medium text-muted-foreground/60">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
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
          <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">
            {new Date(wish.createdAt).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
          </span>
        </div>
      </div>
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
  const { data: wishes, isLoading, isError } = useMyWishes()

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        {/* Decorative watermark */}
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
                — My List
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                WISH LIST
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

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <WishCardSkeleton key={i} index={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="border border-border bg-white p-10 text-center">
              <p className="text-sm text-muted-foreground">
                ウィッシュリストの読み込みに失敗しました。再度お試しください。
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && wishes?.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="font-headline font-black text-muted-foreground"
                style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0 WISHES
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                探しているアイテムや条件を登録しましょう
              </p>
              <Link
                to="/wishes/new"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                ウィッシュを追加する
              </Link>
            </div>
          )}

          {/* Grid */}
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

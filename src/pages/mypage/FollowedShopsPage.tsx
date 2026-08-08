import { Link } from 'react-router'
import { MapPin, Plus, Check } from 'lucide-react'
import { useFollowedShops, useToggleFollow } from '@/hooks/useShopFollows'
import { cn } from '@/lib/utils'

import { getR2Url } from '@/lib/r2'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-photos', storagePath)

interface FollowedShop {
  id: string
  name: string
  follower_count: number
  areas: { id: number; prefecture: string; city: string; slug: string } | null
  shop_photos: { id: string; shop_id: string; storage_path: string; order: number; created_at: string }[]
}

const FollowedShopCard = ({ shop, index }: { shop: FollowedShop; index: number }) => {
  const { mutate: toggleFollow, isPending } = useToggleFollow(shop.id)
  const photo = shop.shop_photos[0]

  return (
    <div
      className="wish-card-enter group relative"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Photo area */}
      <Link to={`/shops/${shop.id}`} className="block">
        <div className="relative overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '3/4' }}>
          {photo ? (
            <img
              src={getPhotoUrl(photo.storage_path)}
              alt={shop.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span
                className="font-headline font-black text-muted-foreground/10 leading-none tracking-tighter"
                style={{ fontSize: 'clamp(40px, 8vw, 80px)' }}
              >
                {shop.name[0]?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Bottom text overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
            <h3 className="font-headline text-sm font-black leading-tight tracking-tight text-white drop-shadow-sm md:text-base">
              {shop.name}
            </h3>
            {shop.areas && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-white/60">
                  <MapPin className="h-2.5 w-2.5" />
                  {shop.areas.city}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* フォロー解除ボタン */}
      <button
        onClick={() => toggleFollow(true)}
        disabled={isPending}
        className={cn(
          'absolute right-2.5 top-2.5 flex h-7 items-center gap-1 rounded-full px-2.5',
          'bg-black/30 text-[10px] font-bold text-white/80 backdrop-blur-sm',
          'opacity-0 transition-all duration-200 group-hover:opacity-100',
          'hover:bg-red-500/80 hover:text-white',
          'disabled:opacity-30',
        )}
        title="フォローを解除"
      >
        <Check className="h-3 w-3" />
        フォロー中
      </button>
    </div>
  )
}

const FollowedShopCardSkeleton = ({ index }: { index: number }) => (
  <div
    className="animate-pulse rounded-xl bg-muted"
    style={{ aspectRatio: '3/4', animationDelay: `${index * 55}ms` }}
  />
)

const FollowedShopsPage = () => {
  const { data: follows, isLoading, isError } = useFollowedShops()

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        {/* Decorative watermark */}
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            FOLLOWS
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-end justify-between pb-6">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
                — MYPAGE
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
                フォロー中の店舗
              </h1>
            </div>

            <div className="mb-0.5 flex items-center gap-3">
              {!isLoading && follows && follows.length > 0 && (
                <span className="font-headline text-[11px] font-black tabular-nums text-foreground/25">
                  {String(follows.length).padStart(3, '0')}
                </span>
              )}
              <Link
                to="/shops"
                className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-foreground/10 px-3 text-xs font-bold text-foreground/80 transition-colors hover:bg-foreground/20 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                店舗を探す
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FollowedShopCardSkeleton key={i} index={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-xl border border-border bg-background p-10 text-center">
              <p className="text-sm text-muted-foreground">
                フォロー中の店舗の読み込みに失敗しました。再度お試しください。
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && follows?.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="font-headline font-black text-muted-foreground"
                style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0 FOLLOWS
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                気になる店舗をフォローして、最新情報を受け取りましょう
              </p>
              <Link
                to="/shops"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                店舗を探す
              </Link>
            </div>
          )}

          {/* Gallery grid */}
          {!isLoading && follows && follows.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 md:gap-4">
              {follows.map(({ shops }, i) => (
                <FollowedShopCard key={shops.id} shop={shops} index={i} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default FollowedShopsPage

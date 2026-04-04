import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { MapPin, Phone, Globe, Instagram, Twitter, Star, Heart, ChevronLeft, ArrowUpRight } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { useFavoriteStatus, useToggleFavorite } from '@/hooks/useFavorites'
import { useReviews, useMyReview } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'
import { ReviewCard } from '@/components/review/ReviewCard'
import { ReviewForm } from '@/components/review/ReviewForm'
import { cn } from '@/lib/utils'
import type { BusinessHours } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string, width = 1600) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=${width}&resize=cover`

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S',
}

const DAY_FULL: Record<keyof BusinessHours, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土', sun: '日',
}

const BusinessHoursGrid = ({
  hours,
  closedDays,
}: {
  hours: BusinessHours | null
  closedDays: string[]
}) => {
  if (!hours) {
    return <p className="text-xs text-muted-foreground">情報なし</p>
  }
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-sm border border-border bg-border">
      {(Object.keys(DAY_LABELS) as (keyof BusinessHours)[]).map((day) => {
        const dayHours = hours[day]
        const isClosed = closedDays.includes(day)
        const isSat = day === 'sat'
        const isSun = day === 'sun'
        return (
          <div key={day} className="bg-background px-1 py-2 text-center">
            <p
              className={cn(
                'mb-1.5 text-[8px] font-black uppercase tracking-wider',
                isSat ? 'text-sky-500' : isSun ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              {DAY_FULL[day]}
            </p>
            {isClosed ? (
              <p className="text-[9px] font-bold text-muted-foreground/60">休</p>
            ) : dayHours ? (
              <>
                <p className="text-[9px] font-bold tabular-nums leading-tight">{dayHours.open}</p>
                <p className="text-[8px] text-muted-foreground">↓</p>
                <p className="text-[9px] font-bold tabular-nums leading-tight">{dayHours.close}</p>
              </>
            ) : (
              <p className="text-[9px] text-muted-foreground">—</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const StarRow = ({
  rating,
  size = 'sm',
}: {
  rating: number | null
  size?: 'sm' | 'md'
}) => {
  const filled = rating != null ? Math.round(rating) : 0
  const cls = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(cls, s <= filled ? 'fill-amber-500 text-amber-500' : 'text-border')}
        />
      ))}
    </div>
  )
}

const ShopDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: shop, isLoading, isError } = useShop(id ?? '')
  const { data: isFavorited } = useFavoriteStatus(id ?? '')
  const { mutate: toggleFavorite } = useToggleFavorite(id ?? '')
  const { data: reviews } = useReviews(id ?? '')
  const { data: myReview } = useMyReview(id ?? '')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="aspect-[4/3] w-full animate-pulse bg-muted md:aspect-[21/9]" />
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <div className="h-3 w-20 rounded-sm bg-muted" />
              <div className="h-7 w-2/3 rounded-sm bg-muted" />
              <div className="h-24 rounded-sm bg-muted" />
            </div>
            <div className="h-56 rounded-sm bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !shop) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-16">
        <div className="border border-border p-12 text-center">
          <p className="font-headline text-sm font-bold text-muted-foreground">
            店舗情報の読み込みに失敗しました
          </p>
        </div>
      </div>
    )
  }

  const selectedPhoto = shop.photos[selectedPhotoIdx]

  return (
    <div className="bg-background">
      {/* ── Hero Gallery ──────────────────────────────── */}
      <div className="relative overflow-hidden bg-primary">
        {/* Back nav */}
        <div className="absolute left-0 right-0 top-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-4 pt-4 pb-10 md:px-16">
          <Link
            to="/shops"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3 w-3" />
            店舗一覧
          </Link>
        </div>

        {/* Main photo */}
        <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-[21/9]">
          {selectedPhoto ? (
            <img
              key={selectedPhotoIdx}
              src={getPhotoUrl(selectedPhoto.storagePath)}
              alt={shop.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl">🏪</div>
          )}
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Shop name — editorial bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 md:px-16 md:pb-10">
            {shop.categories.length > 0 && (
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.6em] text-white/50">
                {shop.categories.map((c) => c.name).join(' · ')}
              </p>
            )}
            <h1 className="font-headline text-3xl font-black leading-none text-white md:text-5xl lg:text-6xl">
              {shop.name}
            </h1>
            {shop.area && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-white/50">
                <MapPin className="h-3 w-3" />
                <span>
                  {shop.area.prefecture}&ensp;{shop.area.city}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail strip */}
        {shop.photos.length > 1 && (
          <div className="no-scrollbar flex gap-px overflow-x-auto bg-black">
            {shop.photos.map((photo, idx) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhotoIdx(idx)}
                className={cn(
                  'relative h-14 w-20 shrink-0 overflow-hidden transition-all duration-200 md:h-16 md:w-24',
                  idx === selectedPhotoIdx ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                )}
              >
                <img
                  src={getPhotoUrl(photo.storagePath, 200)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {idx === selectedPhotoIdx && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px]">

          {/* ── Left: Content ─────────────────────────── */}
          <div className="min-w-0">
            {/* Rating + Favorite (mobile only) */}
            <div className="mb-8 flex items-center gap-6 lg:hidden">
              <StarRow rating={shop.averageRating} size="md" />
              <span className="font-headline text-sm font-black tabular-nums">
                {shop.averageRating != null ? shop.averageRating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">({shop.reviewCount}件)</span>
              <button
                onClick={() => {
                  if (!user) { navigate('/auth/login'); return }
                  toggleFavorite(isFavorited ?? false)
                }}
                className={cn(
                  'ml-auto flex items-center gap-1.5 text-sm font-bold transition-colors',
                  isFavorited ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Heart className={cn('h-5 w-5 transition-all', isFavorited ? 'fill-primary' : '')} />
                <span className="tabular-nums text-xs">{shop.favoriteCount}</span>
              </button>
            </div>

            {/* Description */}
            {shop.description && (
              <section className="mb-10">
                <SectionLabel>About</SectionLabel>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-[1.9] text-foreground/80">
                  {shop.description}
                </p>
              </section>
            )}

            {/* Brands */}
            {shop.brands.length > 0 && (
              <section className="mb-10">
                <SectionLabel>Brands</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                  {shop.brands.map((brand) => (
                    <span key={brand.id} className="font-headline text-sm font-bold">
                      {brand.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {shop.tags.length > 0 && (
              <section className="mb-10">
                <SectionLabel>Tags</SectionLabel>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {shop.tags.map((tag) => (
                    <span key={tag.id} className="text-[11px] text-muted-foreground">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right: Info Panel ─────────────────────── */}
          <aside className="lg:sticky lg:top-[calc(56px+24px)] lg:self-start">
            <div className="border border-border">
              {/* Rating + Favorite (desktop) */}
              <div className="hidden border-b border-border px-5 py-4 lg:flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRow rating={shop.averageRating} />
                  <span className="text-xs font-black tabular-nums">
                    {shop.averageRating != null ? shop.averageRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({shop.reviewCount})</span>
                </div>
                <button
                  onClick={() => {
                    if (!user) { navigate('/auth/login'); return }
                    toggleFavorite(isFavorited ?? false)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-bold transition-colors',
                    isFavorited ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  )}
                  title={isFavorited ? 'お気に入り解除' : 'お気に入り追加'}
                >
                  <Heart className={cn('h-4 w-4 transition-all', isFavorited ? 'fill-primary' : '')} />
                  <span className="tabular-nums">{shop.favoriteCount}</span>
                </button>
              </div>

              {/* Price range */}
              {shop.priceRange && (
                <div className="border-b border-border px-5 py-4">
                  <PanelLabel>Price Range</PanelLabel>
                  <p className="mt-1 font-headline text-sm font-bold">{shop.priceRange.label}</p>
                </div>
              )}

              {/* Business hours */}
              <div className="border-b border-border px-5 py-4">
                <PanelLabel>Hours</PanelLabel>
                <div className="mt-3">
                  <BusinessHoursGrid hours={shop.businessHours} closedDays={shop.closedDays} />
                </div>
              </div>

              {/* Links */}
              {(shop.phone ?? shop.websiteUrl ?? shop.instagramUrl ?? shop.twitterUrl) && (
                <div className="divide-y divide-border">
                  {shop.phone && (
                    <a
                      href={`tel:${shop.phone}`}
                      className="flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-colors hover:bg-muted"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span>{shop.phone}</span>
                    </a>
                  )}
                  {shop.websiteUrl && (
                    <ExternalLink href={shop.websiteUrl} icon={<Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                      公式サイト
                    </ExternalLink>
                  )}
                  {shop.instagramUrl && (
                    <ExternalLink href={shop.instagramUrl} icon={<Instagram className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                      Instagram
                    </ExternalLink>
                  )}
                  {shop.twitterUrl && (
                    <ExternalLink href={shop.twitterUrl} icon={<Twitter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                      X
                    </ExternalLink>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ── Reviews ───────────────────────────────────── */}
        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <SectionLabel>Reviews</SectionLabel>
              <p className="mt-1 font-headline text-2xl font-black leading-none">
                {shop.reviewCount > 0 ? (
                  <>
                    {shop.reviewCount}
                    <span className="ml-1.5 text-base font-bold text-muted-foreground">件</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/30">0</span>
                )}
              </p>
            </div>
            {!showReviewForm && (
              <button
                onClick={() => {
                  if (!user) { navigate('/auth/login'); return }
                  setShowReviewForm(true)
                }}
                className="flex h-9 shrink-0 items-center gap-2 border border-primary px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
              >
                {myReview ? 'レビューを編集する' : 'レビューを書く'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-8 border border-border p-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                — {myReview ? 'レビューを編集する' : 'レビューを書く'}
              </p>
              <ReviewForm
                shopId={shop.id}
                existingReview={myReview}
                onSuccess={() => setShowReviewForm(false)}
              />
              <button
                onClick={() => setShowReviewForm(false)}
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                キャンセル
              </button>
            </div>
          )}

          {(reviews?.length ?? 0) === 0 ? (
            <div className="py-16 text-center">
              <p
                className="font-headline font-black text-muted-foreground/20"
                style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0
              </p>
              <p className="mt-3 text-xs text-muted-foreground">まだレビューがありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews?.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">— {children}</p>
)

const PanelLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground">{children}</p>
)

const ExternalLink = ({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center justify-between px-5 py-3.5 text-xs font-bold transition-colors hover:bg-muted"
  >
    <span className="flex items-center gap-2">
      {icon}
      {children}
    </span>
    <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </a>
)

export default ShopDetailPage

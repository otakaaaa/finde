import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { MapPin, Phone, Globe, Instagram, Star, Heart, ChevronLeft, ArrowUpRight, Store } from 'lucide-react'
import { XLogo } from '@/components/icons/XLogo'
import { TikTokLogo } from '@/components/icons/TikTokLogo'
import { useShop } from '@/hooks/useShop'
import { useShopHasOwner } from '@/hooks/useShopHasOwner'
import { Seo } from '@/components/seo/Seo'
import { useShopMasterData } from '@/hooks/useShopMasterData'
import { useFavoriteStatus, useToggleFavorite } from '@/hooks/useFavorites'
import { useReviews, useMyReview } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'
import { ReviewCard } from '@/components/review/ReviewCard'
import { ReviewForm } from '@/components/review/ReviewForm'
import { useSharePostsByShop } from '@/hooks/useSharePosts'
import { SharePostCard } from '@/components/share/SharePostCard'
import { useShopItems } from '@/hooks/useShopItems'
import { cn } from '@/lib/utils'
import { OWNER_FEATURE_ENABLED } from '@/config/features'
import type { BusinessHours } from '@/types'

import { getR2Url } from '@/lib/r2'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-photos', storagePath)

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
  const { data: shopHasOwner } = useShopHasOwner(id ?? '')
  const { data: masterData } = useShopMasterData()
  const { data: isFavorited } = useFavoriteStatus(id ?? '')
  const { mutate: toggleFavorite } = useToggleFavorite(id ?? '')
  const { data: reviews } = useReviews(id ?? '')
  const { data: myReview } = useMyReview(id ?? '')
  const { data: sharePosts } = useSharePostsByShop(id ?? '')
  const { data: shopItems } = useShopItems(id ?? '')
  const availableItems = (shopItems ?? []).filter((item) => item.isAvailable)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0)

  const handleToggleFavorite = () => {
    if (!user) { navigate('/auth/login'); return }
    toggleFavorite(isFavorited ?? false)
  }

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
        <Seo title="店舗が見つかりません" noindex />
        <div className="border border-border p-12 text-center">
          <p className="font-headline text-sm font-bold text-muted-foreground">
            店舗情報の読み込みに失敗しました
          </p>
        </div>
      </div>
    )
  }

  const selectedPhoto = shop.photos[selectedPhotoIdx]

  const prefName = masterData?.prefectures.find((p) => p.id === shop.prefectureId)?.name
  const cityName = masterData?.cities.find((c) => c.id === shop.cityId)?.name
  const locationText = [prefName, cityName].filter(Boolean).join(' ')
  const categoryText = shop.categories.map((c) => c.name).join('・')
  const seoTitle = locationText ? `${shop.name}（${locationText}）` : shop.name
  const seoDescription =
    shop.description?.trim() ||
    [
      locationText && `${locationText}の`,
      categoryText || 'セレクトショップ',
      `「${shop.name}」の店舗情報・取り扱いブランド・営業時間をFINDEでチェック。`,
    ]
      .filter(Boolean)
      .join('')
  const seoImage = shop.photos[0] ? getPhotoUrl(shop.photos[0].storagePath) : undefined

  return (
    <div className="bg-background">
      <Seo
        title={seoTitle}
        description={seoDescription.slice(0, 120)}
        path={`/shops/${shop.id}`}
        image={seoImage}
      />
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
            <img
              src="/noimage.png"
              alt={shop.name}
              className="h-full w-full object-cover"
            />
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
            {(shop.prefectureId != null || shop.cityId != null) && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-white/50">
                <MapPin className="h-3 w-3" />
                <span>
                  {masterData?.prefectures.find((p) => p.id === shop.prefectureId)?.name}
                  {shop.cityId != null && (
                    <>&ensp;{masterData?.cities.find((c) => c.id === shop.cityId)?.name}</>
                  )}
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
                  src={getPhotoUrl(photo.storagePath)}
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
                onClick={handleToggleFavorite}
                className={cn(
                  'ml-auto flex items-center gap-1.5 text-sm font-bold transition-colors',
                  isFavorited ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Heart className={cn('h-5 w-5 transition-all', isFavorited ? 'fill-primary' : '')} />
                <span className="tabular-nums text-xs">{shop.favoriteCount}</span>
              </button>
            </div>

            {/* 詳細 */}
            {shop.description && (
              <section className="mb-10">
                <SectionLabel>詳細</SectionLabel>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-[1.9] text-foreground/80">
                  {shop.description}
                </p>
              </section>
            )}

            {/* Brands */}
            {shop.brands.length > 0 && (
              <section className="mb-10">
                <SectionLabel>Brands</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2">
                  {shop.brands.map((brand) => (
                    <Link
                      key={brand.id}
                      to={`/brands/${brand.id}`}
                      className="group flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 transition-all hover:border-primary/40 hover:bg-primary/[0.03]"
                    >
                      <span className="font-headline text-[12px] font-black tracking-tight text-foreground/70 transition-colors group-hover:text-primary/80">
                        {brand.name}
                      </span>
                      <ArrowUpRight className="h-2.5 w-2.5 shrink-0 text-border transition-colors group-hover:text-primary/50" />
                    </Link>
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
                  onClick={handleToggleFavorite}
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

              {/* 住所 */}
              {(shop.prefectureId != null || shop.cityId != null || shop.address) && (
                <div className="border-b border-border px-5 py-4">
                  <PanelLabel>住所</PanelLabel>
                  <div className="mt-1.5 space-y-0.5">
                    {(shop.prefectureId != null || shop.cityId != null) && (
                      <p className="text-xs font-medium">
                        {masterData?.prefectures.find((p) => p.id === shop.prefectureId)?.name}
                        {shop.cityId != null && (
                          <>&nbsp;{masterData?.cities.find((c) => c.id === shop.cityId)?.name}</>
                        )}
                      </p>
                    )}
                    {shop.address && (
                      <p className="text-xs text-muted-foreground">{shop.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 価格帯 */}
              {shop.priceRange && (
                <div className="border-b border-border px-5 py-4">
                  <PanelLabel>価格帯</PanelLabel>
                  <p className="mt-1 font-headline text-sm font-bold">{shop.priceRange.label}</p>
                </div>
              )}

              {/* 営業時間 */}
              <div className="border-b border-border px-5 py-4">
                <PanelLabel>営業時間</PanelLabel>
                <div className="mt-3">
                  <BusinessHoursGrid hours={shop.businessHours} closedDays={shop.closedDays} />
                </div>
              </div>

              {/* Links */}
              {(shop.phone ?? shop.websiteUrl ?? shop.instagramUrl ?? shop.twitterUrl ?? shop.tiktokUrl) && (
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
                    <ExternalLink href={shop.twitterUrl} icon={<XLogo className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                      X
                    </ExternalLink>
                  )}
                  {shop.tiktokUrl && (
                    <ExternalLink href={shop.tiktokUrl} icon={<TikTokLogo className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}>
                      TikTok
                    </ExternalLink>
                  )}
                </div>
              )}
            </div>

            {/* オーナー申請 CTA — すでにオーナーが紐づいている店舗では非表示 */}
            {OWNER_FEATURE_ENABLED && !shopHasOwner && (
              <div className="mt-4 border border-dashed border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  <div>
                    <p className="text-[11px] font-bold text-foreground/70">
                      この店舗のオーナーですか？
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/50">
                      オーナー登録をすると店舗情報を管理できます
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) { navigate('/auth/login'); return }
                        navigate(`/owner-application/new?shopId=${shop.id}&shopName=${encodeURIComponent(shop.name)}`)
                      }}
                      className="mt-2.5 text-[10px] font-bold text-primary underline underline-offset-4 transition-colors hover:text-primary/70"
                    >
                      オーナー登録を申請する
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── 取り扱いアイテム ──────────────────────────── */}
        {availableItems.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <SectionLabel>取り扱いアイテム</SectionLabel>
                <p className="mt-1 font-headline text-2xl font-black leading-none">
                  {availableItems.length}
                  <span className="ml-1.5 text-base font-bold text-muted-foreground">点</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {availableItems.map((item) => {
                const coverPhoto = item.photos[0]
                return (
                  <Link
                    key={item.id}
                    to={`/shops/${shop.id}/items/${item.id}`}
                    className="group border border-border bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {coverPhoto ? (
                        <img
                          src={getR2Url('shop-items', coverPhoto.storagePath)}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="font-headline text-[11px] font-black tracking-tight text-foreground/80 line-clamp-1">
                        {item.name}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        {item.itemType && (
                          <p className="text-[9px] text-muted-foreground/50 line-clamp-1">{item.itemType.name}</p>
                        )}
                        {item.price != null && (
                          <p className="shrink-0 font-headline text-[11px] font-black tabular-nums text-foreground/70">
                            ¥{item.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── シャレ活 ──────────────────────────────────── */}
        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <SectionLabel>シャレ活</SectionLabel>
              <p className="mt-1 font-headline text-2xl font-black leading-none">
                {(sharePosts?.length ?? 0) > 0 ? (
                  <>
                    {sharePosts!.length}
                    <span className="ml-1.5 text-base font-bold text-muted-foreground">件</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/30">0</span>
                )}
              </p>
            </div>
          </div>

          {(sharePosts?.length ?? 0) === 0 ? (
            <div className="py-16 text-center">
              <p
                className="font-headline font-black text-muted-foreground/20"
                style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0
              </p>
              <p className="mt-3 text-xs text-muted-foreground">まだシャレ活の投稿がありません</p>
            </div>
          ) : (
            <div className="gap-3 divide-y divide-border border-t border-border">
              {sharePosts!.map((post) => (
                <SharePostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews ───────────────────────────────────── */}
        <section className="mt-16 border-t border-border pt-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <SectionLabel>レビュー</SectionLabel>
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

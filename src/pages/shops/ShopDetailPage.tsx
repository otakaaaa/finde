import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { MapPin, Phone, Clock, Globe, Instagram, Twitter, Star, Heart, ChevronLeft } from 'lucide-react'
import { useShop } from '@/hooks/useShop'
import { useFavoriteStatus, useToggleFavorite } from '@/hooks/useFavorites'
import { useReviews, useMyReview } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'
import { ReviewCard } from '@/components/review/ReviewCard'
import { ReviewForm } from '@/components/review/ReviewForm'
import { Button } from '@/components/ui/button'
import type { BusinessHours } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string, width = 800) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=${width}&resize=contain`

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  mon: '月', tue: '火', wed: '水', thu: '木',
  fri: '金', sat: '土', sun: '日',
}

const BusinessHoursTable = ({ hours, closedDays }: { hours: BusinessHours | null; closedDays: string[] }) => {
  if (!hours) return <p className="text-sm text-muted-foreground">営業時間情報なし</p>

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {(Object.keys(DAY_LABELS) as (keyof BusinessHours)[]).map((day) => {
        const dayHours = hours[day]
        const isClosed = closedDays.includes(day)
        return (
          <div key={day} className="contents">
            <dt className="font-medium">{DAY_LABELS[day]}</dt>
            <dd className={isClosed ? 'text-muted-foreground' : ''}>
              {isClosed ? '定休日' : dayHours ? `${dayHours.open}〜${dayHours.close}` : '—'}
            </dd>
          </div>
        )
      })}
    </dl>
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !shop) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          店舗情報の読み込みに失敗しました
        </div>
      </div>
    )
  }

  const selectedPhoto = shop.photos[selectedPhotoIdx]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back */}
      <Link
        to="/shops"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        店舗一覧に戻る
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div>
          {/* Photo Gallery */}
          {shop.photos.length > 0 ? (
            <div>
              <div className="mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg bg-muted">
                <img
                  src={getPhotoUrl(selectedPhoto.storagePath)}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {shop.photos.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {shop.photos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoIdx(idx)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                        idx === selectedPhotoIdx ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={getPhotoUrl(photo.storagePath, 128)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-lg bg-muted text-6xl">
              🏪
            </div>
          )}

          {/* Description */}
          {shop.description && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold">店舗について</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {shop.description}
              </p>
            </div>
          )}

          {/* Brands */}
          {shop.brands.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">取り扱いブランド</h2>
              <div className="flex flex-wrap gap-2">
                {shop.brands.map((brand) => (
                  <span
                    key={brand.id}
                    className="rounded-full border bg-white px-3 py-1 text-sm"
                  >
                    {brand.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {shop.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                >
                  {cat.name}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>

            {shop.area && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{shop.area.prefecture} {shop.area.city}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {shop.averageRating ? shop.averageRating.toFixed(1) : '—'}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({shop.reviewCount}件)
                </span>
              </div>

              <button
                onClick={() => {
                  if (!user) { navigate('/auth/login'); return }
                  toggleFavorite(isFavorited ?? false)
                }}
                className="flex items-center gap-1 text-sm transition-colors hover:text-primary"
                title={isFavorited ? 'お気に入り解除' : 'お気に入り追加'}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                <span className="text-muted-foreground">{shop.favoriteCount}</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 rounded-lg border p-4 text-sm">
            {shop.priceRange && (
              <div className="flex items-start gap-2">
                <span className="font-medium text-muted-foreground w-20 shrink-0">価格帯</span>
                <span>{shop.priceRange.label}</span>
              </div>
            )}

            {shop.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a href={`tel:${shop.phone}`} className="hover:underline">
                  {shop.phone}
                </a>
              </div>
            )}

            {shop.websiteUrl && (
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a
                  href={shop.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  公式サイト
                </a>
              </div>
            )}

            {shop.instagramUrl && (
              <div className="flex items-start gap-2">
                <Instagram className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a
                  href={shop.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Instagram
                </a>
              </div>
            )}

            {shop.twitterUrl && (
              <div className="flex items-start gap-2">
                <Twitter className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a
                  href={shop.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X (Twitter)
                </a>
              </div>
            )}
          </div>

          {/* Business Hours */}
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">営業時間</h3>
            </div>
            <BusinessHoursTable hours={shop.businessHours} closedDays={shop.closedDays} />
          </div>

          {/* Tags */}
          {shop.tags.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">タグ</h3>
              <div className="flex flex-wrap gap-1">
                {shop.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            レビュー <span className="text-base font-normal text-muted-foreground">({shop.reviewCount}件)</span>
          </h2>
          {user && !showReviewForm && (
            <Button
              variant={myReview ? 'outline' : 'default'}
              onClick={() => setShowReviewForm(true)}
            >
              {myReview ? 'レビューを編集' : 'レビューを書く'}
            </Button>
          )}
          {!user && (
            <Button variant="outline" onClick={() => navigate('/auth/login')}>
              ログインしてレビューを書く
            </Button>
          )}
        </div>

        {showReviewForm && (
          <div className="mb-6 rounded-lg border p-4">
            <h3 className="mb-4 font-medium">
              {myReview ? 'レビューを編集' : 'レビューを投稿'}
            </h3>
            <ReviewForm
              shopId={shop.id}
              existingReview={myReview}
              onSuccess={() => setShowReviewForm(false)}
            />
            <button
              onClick={() => setShowReviewForm(false)}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              キャンセル
            </button>
          </div>
        )}

        {reviews?.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだレビューがありません</p>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopDetailPage

import { Star, Flag } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import type { Review } from '@/types'

interface ReviewCardProps {
  review: Review
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/review-photos/${storagePath}?width=200&height=200&resize=cover`

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    ))}
  </div>
)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const { user } = useAuth()
  const { openReviewReportModal } = useUiStore()

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
            {review.user.displayName?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium">{review.user.displayName ?? '匿名ユーザー'}</p>
            <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} />
          {user && user.id !== review.userId && (
            <button
              onClick={() => openReviewReportModal(review.id)}
              className="text-muted-foreground hover:text-foreground"
              title="通報する"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{review.body}</p>

      {review.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.photos.map((photo) => (
            <img
              key={photo.id}
              src={getPhotoUrl(photo.storagePath)}
              alt=""
              className="h-20 w-20 rounded object-cover"
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { Flag, Star } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Review } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/review-photos/${storagePath}?width=300&height=300&resize=cover`

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={cn(
          'h-3 w-3',
          s <= rating ? 'fill-amber-500 text-amber-500' : 'text-border',
        )}
      />
    ))}
  </div>
)

export const ReviewCard = ({ review }: { review: Review }) => {
  const { user } = useAuth()
  const { openReviewReportModal } = useUiStore()

  const initial = review.user.displayName?.[0]?.toUpperCase() ?? '?'
  const canReport = !!user && user.id !== review.userId

  return (
    <div className="wish-card-enter group relative border-l-[3px] border-l-border bg-white editorial-shadow">
      <div className="px-4 py-4 sm:px-5">
        {/* ── Header row ───────────────────────── */}
        <div className="mb-3 flex items-start justify-between gap-3">
          {/* User info */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-muted font-headline text-[11px] font-black text-muted-foreground/60">
              {initial}
            </div>
            <div>
              <p className="font-headline text-[12px] font-black tracking-tight text-foreground/80">
                {review.user.displayName ?? '匿名ユーザー'}
              </p>
              <p className="text-[9px] tabular-nums text-muted-foreground/40">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>

          {/* Right: stars + report */}
          <div className="flex shrink-0 items-center gap-2">
            <StarRow rating={review.rating} />
            <span className="font-headline text-[10px] font-black tabular-nums text-foreground/50">
              {review.rating}.0
            </span>

            {canReport && (
              <button
                onClick={() => openReviewReportModal(review.id)}
                className="ml-1 text-muted-foreground/20 transition-colors hover:text-muted-foreground/60 focus:outline-none"
                title="このレビューを通報する"
                aria-label="通報する"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Body ─────────────────────────────── */}
        <p className="text-[12px] leading-[1.8] text-foreground/70 whitespace-pre-wrap">
          {review.body}
        </p>

        {/* ── Photos ───────────────────────────── */}
        {review.photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {review.photos.map((photo) => (
              <img
                key={photo.id}
                src={getPhotoUrl(photo.storagePath)}
                alt=""
                className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

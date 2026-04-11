import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Flag, Star, EyeOff, Eye, AlertTriangle, Store, User, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Types ──────────────────────────────────────────────────────

type ReviewStatus = 'published' | 'flagged' | 'hidden'

interface ReviewRow {
  id: string
  body: string
  rating: number
  status: ReviewStatus
  ng_score: number
  created_at: string
  shops: { id: string; name: string } | null
  users: { id: string; display_name: string | null } | null
}

interface ReportRow {
  id: string
  reason: string
  note: string | null
  created_at: string
  reviews: ReviewRow
}

// ── Data hooks ─────────────────────────────────────────────────

const useReviewReports = () =>
  useQuery({
    queryKey: ['admin-review-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_reports')
        .select(`
          id, reason, note, created_at,
          reviews (
            id, body, rating, status, ng_score, created_at,
            shops ( id, name ),
            users ( id, display_name )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100) as { data: ReportRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const useAllReviews = (status: string) =>
  useQuery({
    queryKey: ['admin-reviews', status],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('id, body, rating, status, ng_score, created_at, shops ( id, name ), users ( id, display_name )')
        .order('created_at', { ascending: false })
        .limit(100)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{ data: ReviewRow[] | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

// ── Config ─────────────────────────────────────────────────────

const REASON_LABEL: Record<string, string> = {
  false_info:  '虚偽情報',
  harassment:  'ハラスメント',
  irrelevant:  '無関係な内容',
  other:       'その他',
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; borderClass: string; badgeClass: string }> = {
  published: { label: '公開中',   borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  flagged:   { label: 'フラグ済', borderClass: 'border-l-amber-400',   badgeClass: 'bg-amber-50 text-amber-700' },
  hidden:    { label: '非表示',   borderClass: 'border-l-border',      badgeClass: 'bg-muted text-muted-foreground' },
}

const REVIEW_STATUS_FILTERS = [
  { value: 'all',       label: 'すべて' },
  { value: 'published', label: '公開中' },
  { value: 'flagged',   label: 'フラグ済' },
  { value: 'hidden',    label: '非表示' },
] as const

// ── Sub-components ─────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-2.5 w-2.5',
          i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted',
        )}
      />
    ))}
    <span className="ml-1 tabular-nums text-[10px] text-muted-foreground/60">{rating}/5</span>
  </span>
)

const NgScoreBadge = ({ score }: { score: number }) => {
  const cls =
    score >= 80 ? 'bg-red-50 text-red-600' :
    score >= 40 ? 'bg-amber-50 text-amber-600' :
                  'bg-muted text-muted-foreground/60'
  return (
    <span className={cn('rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black tabular-nums uppercase tracking-wider', cls)}>
      NG {score}
    </span>
  )
}

interface ReviewCardProps {
  review: ReviewRow
  onHide: (id: string) => void
  onRestore: (id: string) => void
  isUpdating: boolean
  index: number
  reportReason?: string
  reportNote?: string | null
}

const ReviewCard = ({ review, onHide, onRestore, isUpdating, index, reportReason, reportNote }: ReviewCardProps) => {
  const conf = STATUS_CONFIG[review.status] ?? STATUS_CONFIG.hidden

  return (
    <div
      className={cn(
        'wish-card-enter group relative border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Index */}
          <span className="mt-0.5 w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70">
                <Store className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
                {review.shops?.name ?? '不明な店舗'}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <User className="h-2.5 w-2.5 shrink-0" />
                {review.users?.display_name ?? '匿名'}
              </span>
              <StarRating rating={review.rating} />
              <NgScoreBadge score={review.ng_score} />
              {/* Status badge — mobile */}
              <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
                {conf.label}
              </span>
            </div>

            {/* Report reason */}
            {reportReason && (
              <div className="mb-2 flex items-center gap-1.5">
                <Flag className="h-2.5 w-2.5 shrink-0 text-orange-500" />
                <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-orange-600">
                  {REASON_LABEL[reportReason] ?? reportReason}
                </span>
                {reportNote && (
                  <span className="text-[10px] text-muted-foreground/60 truncate">— {reportNote}</span>
                )}
              </div>
            )}

            {/* Review body */}
            <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground/70">
              {review.body}
            </p>

            {/* Date */}
            <p className="mt-1.5 tabular-nums text-[10px] text-muted-foreground/30">
              {new Date(review.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </p>
          </div>

          {/* Status badge — desktop */}
          <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
            {conf.label}
          </span>

          {/* Actions — mobile always visible */}
          <div className="flex sm:hidden shrink-0 items-center gap-1.5">
            {review.status !== 'hidden' && (
              <button
                onClick={() => onHide(review.id)}
                disabled={isUpdating}
                title="非表示にする"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-50 text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
            {review.status !== 'published' && (
              <button
                onClick={() => onRestore(review.id)}
                disabled={isUpdating}
                title="公開に戻す"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions — desktop hover */}
      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {review.status !== 'hidden' && (
          <button
            onClick={() => onHide(review.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-red-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
          >
            <EyeOff className="h-3 w-3" />
            非表示
          </button>
        )}
        {review.status !== 'published' && (
          <button
            onClick={() => onRestore(review.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
          >
            <Eye className="h-3 w-3" />
            公開に戻す
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

type ViewMode = 'reports' | 'all'

const AdminReviewsPage = () => {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('reports')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all')

  const { data: reports, isLoading: reportsLoading, error: reportsError } = useReviewReports()
  const { data: allReviews, isLoading: reviewsLoading, error: reviewsError } = useAllReviews(reviewStatusFilter)

  const { mutate: updateReviewStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: string }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ status } as never)
        .eq('id', reviewId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-review-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['my-review'] })
    },
  })

  const isLoading = viewMode === 'reports' ? reportsLoading : reviewsLoading
  const error     = viewMode === 'reports' ? reportsError  : reviewsError

  const reportsPagination = usePagination(reports ?? [])
  const allReviewsPagination = usePagination(allReviews ?? [])

  useEffect(() => { reportsPagination.resetPage() }, [viewMode])
  useEffect(() => { allReviewsPagination.resetPage() }, [viewMode, reviewStatusFilter])

  const reviewCounts = {
    all:       allReviews?.length ?? 0,
    published: allReviews?.filter((r) => r.status === 'published').length ?? 0,
    flagged:   allReviews?.filter((r) => r.status === 'flagged').length ?? 0,
    hidden:    allReviews?.filter((r) => r.status === 'hidden').length ?? 0,
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            REVIEWS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボード
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  レビュー管理
                </h1>
              </div>

              {(reports?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 rounded-sm border border-orange-400/30 bg-orange-400/10 px-3 py-2">
                  <AlertTriangle className="h-3 w-3 text-orange-300" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-wider text-orange-300">
                    {reports?.length} 件の通報
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* View mode tabs */}
          <div className="mb-6 flex items-center gap-4 border-b border-border pb-0">
            {(
              [
                { value: 'reports' as ViewMode, label: '通報レビュー', icon: <Flag className="h-3 w-3" />, count: reports?.length },
                { value: 'all'     as ViewMode, label: 'すべてのレビュー', icon: <MessageSquare className="h-3 w-3" />, count: undefined },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setViewMode(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 pb-3 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                  viewMode === tab.value
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground',
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'rounded-sm px-1 tabular-nums text-[9px]',
                    viewMode === tab.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Review status filters (all-reviews view only) */}
          {viewMode === 'all' && (
            <div className="mb-6 flex gap-1">
              {REVIEW_STATUS_FILTERS.map((f) => {
                const count = reviewCounts[f.value]
                return (
                  <button
                    key={f.value}
                    onClick={() => setReviewStatusFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                      reviewStatusFilter === f.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={cn(
                        'rounded-sm px-1 tabular-nums text-[9px]',
                        reviewStatusFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{(error as Error).message}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && (
            viewMode === 'reports' ? reports?.length === 0 : allReviews?.length === 0
          ) && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Reviews
              </span>
              <p className="text-xs text-muted-foreground/50">
                {viewMode === 'reports' ? '通報されたレビューはありません' : '該当するレビューがありません'}
              </p>
            </div>
          )}

          {/* Reports list */}
          {!isLoading && viewMode === 'reports' && (reports?.length ?? 0) > 0 && (
            <>
              <div className="space-y-2">
                {reportsPagination.paginatedItems.map((report, i) => (
                  <ReviewCard
                    key={report.id}
                    review={report.reviews}
                    index={(reportsPagination.page - 1) * reportsPagination.pageSize + i}
                    reportReason={report.reason}
                    reportNote={report.note}
                    onHide={(id) => updateReviewStatus({ reviewId: id, status: 'hidden' })}
                    onRestore={(id) => updateReviewStatus({ reviewId: id, status: 'published' })}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
              <AdminPagination
                page={reportsPagination.page}
                totalPages={reportsPagination.totalPages}
                totalItems={reportsPagination.totalItems}
                pageSize={reportsPagination.pageSize}
                onPageChange={reportsPagination.setPage}
                onPageSizeChange={reportsPagination.setPageSize}
              />
            </>
          )}

          {/* All reviews list */}
          {!isLoading && viewMode === 'all' && (allReviews?.length ?? 0) > 0 && (
            <>
              <div className="space-y-2">
                {allReviewsPagination.paginatedItems.map((review, i) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    index={(allReviewsPagination.page - 1) * allReviewsPagination.pageSize + i}
                    onHide={(id) => updateReviewStatus({ reviewId: id, status: 'hidden' })}
                    onRestore={(id) => updateReviewStatus({ reviewId: id, status: 'published' })}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
              <AdminPagination
                page={allReviewsPagination.page}
                totalPages={allReviewsPagination.totalPages}
                totalItems={allReviewsPagination.totalItems}
                pageSize={allReviewsPagination.pageSize}
                onPageChange={allReviewsPagination.setPage}
                onPageSizeChange={allReviewsPagination.setPageSize}
              />
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminReviewsPage

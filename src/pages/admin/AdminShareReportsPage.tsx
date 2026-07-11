import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Flag, EyeOff, Trash2, X, User, MessageSquare, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Types ──────────────────────────────────────────────────────

type CommentStatus = 'published' | 'hidden'

interface CommentReportRow {
  id: string
  reason: string | null
  created_at: string
  comment: {
    id: string
    body: string
    status: CommentStatus
    post_id: string
    user: { id: string; display_name: string | null } | null
  } | null
  reporter: { id: string; display_name: string | null } | null
}

// ── Data hooks ─────────────────────────────────────────────────

const useShareCommentReports = (page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-share-comment-reports', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, count, error } = await supabase
        .from('share_post_reports')
        .select(
          `
          id, reason, created_at,
          comment:share_comments!comment_id (
            id, body, status, post_id,
            user:users!user_id ( id, display_name )
          ),
          reporter:users!reported_by ( id, display_name )
        `,
          { count: 'exact' },
        )
        .not('comment_id', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to) as unknown as {
        data: CommentReportRow[] | null
        count: number | null
        error: { message: string } | null
      }

      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

// ── Config ─────────────────────────────────────────────────────

const COMMENT_STATUS_CONFIG: Record<
  CommentStatus,
  { label: string; borderClass: string; badgeClass: string }
> = {
  published: {
    label: '表示中',
    borderClass: 'border-l-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  hidden: {
    label: '非表示',
    borderClass: 'border-l-border',
    badgeClass: 'bg-muted text-muted-foreground',
  },
}

// ── Sub-components ─────────────────────────────────────────────

interface CommentReportCardProps {
  report: CommentReportRow
  onHideComment: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
  onDismiss: (reportId: string) => void
  isUpdating: boolean
  index: number
}

const CommentReportCard = ({
  report,
  onHideComment,
  onDeleteComment,
  onDismiss,
  isUpdating,
  index,
}: CommentReportCardProps) => {
  const comment = report.comment
  const conf = comment
    ? (COMMENT_STATUS_CONFIG[comment.status] ?? COMMENT_STATUS_CONFIG.published)
    : COMMENT_STATUS_CONFIG.hidden

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
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70">
                <User className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />
                {comment?.user?.display_name ?? '不明なユーザー'}
              </span>
              {comment && (
                <Link
                  to={`/share/${comment.post_id}`}
                  className="text-[10px] text-muted-foreground/50 underline-offset-2 hover:text-primary hover:underline"
                >
                  投稿を見る →
                </Link>
              )}
              <span
                className={cn(
                  'rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
                  conf.badgeClass,
                )}
              >
                {conf.label}
              </span>
            </div>

            {/* Report reason + reporter */}
            <div className="mb-2 flex items-center gap-1.5">
              <Flag className="h-2.5 w-2.5 shrink-0 text-orange-500" />
              {report.reason ? (
                <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-orange-600">
                  {report.reason}
                </span>
              ) : (
                <span className="rounded-sm bg-orange-50 px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider text-orange-600">
                  通報
                </span>
              )}
              <span className="text-[10px] text-muted-foreground/40">
                by {report.reporter?.display_name ?? '不明'}
              </span>
            </div>

            {/* Comment body */}
            {comment ? (
              <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground/70">
                {comment.body}
              </p>
            ) : (
              <p className="text-[11px] italic text-muted-foreground/40">コメントは削除済みです</p>
            )}

            {/* Date */}
            <p className="mt-1.5 tabular-nums text-[10px] text-muted-foreground/30">
              {new Date(report.created_at).toLocaleDateString('ja-JP', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
              })}
            </p>
          </div>

          {/* Actions — mobile */}
          <div className="flex shrink-0 flex-col gap-1 sm:hidden">
            {comment && comment.status !== 'hidden' && (
              <button
                onClick={() => onHideComment(comment.id)}
                disabled={isUpdating}
                title="コメントを非表示"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-amber-50 text-amber-600 transition-colors hover:bg-amber-500 hover:text-white disabled:opacity-40"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            )}
            {comment && (
              <button
                onClick={() => onDeleteComment(comment.id)}
                disabled={isUpdating}
                title="コメントを削除"
                className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-50 text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => onDismiss(report.id)}
              disabled={isUpdating}
              title="通報を却下"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions — desktop hover */}
      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 sm:flex">
        {comment && comment.status !== 'hidden' && (
          <button
            onClick={() => onHideComment(comment.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-amber-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-amber-600 transition-colors hover:bg-amber-500 hover:text-white disabled:opacity-40"
          >
            <EyeOff className="h-3 w-3" />
            非表示
          </button>
        )}
        {comment && (
          <button
            onClick={() => onDeleteComment(comment.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-red-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            削除
          </button>
        )}
        <button
          onClick={() => onDismiss(report.id)}
          disabled={isUpdating}
          className="flex h-7 items-center gap-1 rounded-sm bg-muted px-2 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
        >
          <X className="h-3 w-3" />
          却下
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminShareReportsPage = () => {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  const { data, isLoading, error } = useShareCommentReports(page, pageSize)
  const reports = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-share-comment-reports'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const { mutate: hideComment, isPending: isHiding } = useMutation({
    mutationFn: async (commentId: string) => {
      const { error: err } = (await supabase
        .from('share_comments')
        .update({ status: 'hidden' } as never)
        .eq('id', commentId)) as unknown as { error: { message: string } | null }
      if (err) throw new Error(err.message)
    },
    onSuccess: invalidate,
  })

  const { mutate: deleteComment, isPending: isDeleting } = useMutation({
    mutationFn: async (commentId: string) => {
      const { error: err } = (await supabase
        .from('share_comments')
        .delete()
        .eq('id', commentId)) as unknown as { error: { message: string } | null }
      if (err) throw new Error(err.message)
    },
    onSuccess: invalidate,
  })

  const { mutate: dismissReport, isPending: isDismissing } = useMutation({
    mutationFn: async (reportId: string) => {
      const { error: err } = (await supabase
        .from('share_post_reports')
        .delete()
        .eq('id', reportId)) as unknown as { error: { message: string } | null }
      if (err) throw new Error(err.message)
    },
    onSuccess: invalidate,
  })

  const isUpdating = isHiding || isDeleting || isDismissing

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            REPORTS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 transition-colors hover:text-foreground/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボード
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
                  シャレ活 通報管理
                </h1>
              </div>

              {totalCount > 0 && (
                <div className="flex items-center gap-2 rounded-sm border border-orange-400/30 bg-orange-400/10 px-3 py-2">
                  <AlertTriangle className="h-3 w-3 text-orange-300" />
                  <span className="font-headline text-[10px] font-black uppercase tracking-wider text-orange-300">
                    {totalCount} 件の通報
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

          {/* Section label */}
          <div className="mb-6 flex items-center gap-4 border-b border-border pb-0">
            <div className="flex items-center gap-1.5 border-b-2 border-primary pb-3 font-headline text-[10px] font-black uppercase tracking-wider text-foreground">
              <MessageSquare className="h-3 w-3" />
              通報されたコメント
              {totalCount > 0 && (
                <span className="rounded-sm bg-primary/10 px-1 tabular-nums text-[9px] text-primary">
                  {totalCount}
                </span>
              )}
            </div>
          </div>

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
          {!isLoading && !error && reports.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Reports
              </span>
              <p className="text-xs text-muted-foreground/50">通報されたコメントはありません</p>
            </div>
          )}

          {/* Reports list */}
          {!isLoading && reports.length > 0 && (
            <>
              <div className="space-y-2">
                {reports.map((report, i) => (
                  <CommentReportCard
                    key={report.id}
                    report={report}
                    index={(page - 1) * pageSize + i}
                    onHideComment={hideComment}
                    onDeleteComment={deleteComment}
                    onDismiss={dismissReport}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
              <AdminPagination
                page={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s)
                  setPage(1)
                }}
              />
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminShareReportsPage

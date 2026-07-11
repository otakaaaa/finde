import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, ArrowRight, FileText } from 'lucide-react'
import { useAdminPressReleases } from '@/hooks/usePressReleases'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

type StatusFilter = 'all' | 'published' | 'draft'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'すべて' },
  { value: 'published', label: '公開済み' },
  { value: 'draft',     label: '下書き' },
]

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-1 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex h-7 w-7 items-center justify-center border border-border text-[10px] font-black text-muted-foreground/40 transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        ←
      </button>
      <span className="px-2 font-headline text-[10px] font-black tabular-nums text-muted-foreground/40">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex h-7 w-7 items-center justify-center border border-border text-[10px] font-black text-muted-foreground/40 transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        →
      </button>
    </div>
  )
}

const AdminNewsPage = () => {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { data, isLoading } = useAdminPressReleases(page, PAGE_SIZE, statusFilter)

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))

  const handleFilterChange = (f: StatusFilter) => {
    setStatusFilter(f)
    setPage(1)
  }

  return (
    <div>
      {/* ── Page header ───────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-foreground/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            NEWS
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-foreground/40">— ADMIN</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">
              お知らせ管理
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14 space-y-6">

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status filter tabs */}
            <div className="flex gap-0">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={cn(
                    'border px-4 py-2 font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
                    statusFilter === f.value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-white text-muted-foreground/50 hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* New button */}
            <Link
              to="/admin/news/new"
              className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-4 py-2 font-headline text-[10px] font-black uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-80"
            >
              <Plus className="h-3.5 w-3.5" />
              新規作成
            </Link>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 55}ms` }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 border border-border">
              <FileText className="h-6 w-6 text-muted-foreground/20" />
              <p className="text-[11px] font-medium text-muted-foreground/40">お知らせがありません</p>
            </div>
          ) : (
            <div className="border border-border bg-white editorial-shadow">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={cn(
                    'wish-card-enter flex items-center gap-4 px-5 py-4',
                    i !== items.length - 1 && 'border-b border-border/50',
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Status badge */}
                  <span
                    className={cn(
                      'shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider',
                      item.publishedAt
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-muted text-muted-foreground/50',
                    )}
                  >
                    {item.publishedAt ? '公開済み' : '下書き'}
                  </span>

                  {/* Title */}
                  <p className="flex-1 min-w-0 truncate font-headline text-[13px] font-black tracking-tight text-foreground/80">
                    {item.title}
                  </p>

                  {/* Date */}
                  <time className="shrink-0 font-headline text-[11px] font-black tabular-nums text-muted-foreground/30">
                    {formatDate(item.publishedAt ?? item.createdAt)}
                  </time>

                  {/* Edit link */}
                  <Link
                    to={`/admin/news/${item.id}/edit`}
                    className="group flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/40 transition-colors hover:text-primary"
                  >
                    編集
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>
    </div>
  )
}

export default AdminNewsPage

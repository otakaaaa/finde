import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Megaphone } from 'lucide-react'
import { usePressReleases } from '@/hooks/usePressReleases'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max)}…`

// ── Pagination ────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

const Pagination = ({ page, totalPages, onPage }: PaginationProps) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 pt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center border border-border text-[11px] font-black text-muted-foreground/50 transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={cn(
            'flex h-8 w-8 items-center justify-center border text-[11px] font-black transition-colors',
            p === page
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground/50 hover:border-foreground hover:text-foreground',
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center border border-border text-[11px] font-black text-muted-foreground/50 transition-colors hover:border-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        →
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────

const NewsPage = () => {
  const [page, setPage] = useState(1)
  const { data, isLoading } = usePressReleases(page, PAGE_SIZE)

  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))

  return (
    <div>
      {/* ── Page header ────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            NEWS
          </span>
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— NEWS</p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              お知らせ
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-sm bg-muted" style={{ animationDelay: `${i * 55}ms` }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Megaphone className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-[12px] font-medium text-muted-foreground/40">現在お知らせはありません</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border border-b border-t border-border">
                {items.map((item, i) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="wish-card-enter group flex items-start gap-6 py-6 transition-colors hover:bg-muted/40"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <time className="mt-0.5 shrink-0 font-headline text-[11px] font-black tabular-nums tracking-wider text-muted-foreground/40">
                      {formatDate(item.publishedAt!)}
                    </time>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline text-[14px] font-black tracking-tight text-foreground/80 transition-colors group-hover:text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground/50">
                        {truncate(item.body, 120)}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/20 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/40" />
                  </Link>
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewsPage

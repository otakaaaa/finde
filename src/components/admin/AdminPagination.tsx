import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'

interface AdminPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: PageSizeOption
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

export const AdminPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) => {
  if (totalItems === 0) return null

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      {/* Left: total count */}
      <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">
        {String(totalItems).padStart(3, '0')} 件
      </span>

      {/* Center: page navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center border border-border bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="前のページ"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {buildPageNumbers(page, totalPages).map((item, i) =>
          item === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="flex h-7 w-6 items-center justify-center font-headline text-[10px] font-black text-muted-foreground/30"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(
                'flex h-7 min-w-[28px] items-center justify-center px-1.5 font-headline text-[10px] font-black tabular-nums transition-colors',
                item === page
                  ? 'border border-primary bg-primary text-white'
                  : 'border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center border border-border bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="次のページ"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-1.5">
        <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
          表示件数
        </span>
        <div className="flex gap-0.5">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onPageSizeChange(size)}
              className={cn(
                'flex h-6 items-center px-2 font-headline text-[9px] font-black tabular-nums transition-colors',
                size === pageSize
                  ? 'bg-primary text-white'
                  : 'border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-primary',
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Build array of page numbers with ellipsis
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
}

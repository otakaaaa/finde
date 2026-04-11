import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Search, GitMerge, RotateCcw, Tag, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { PAGE_SIZE_OPTIONS } from '@/hooks/usePagination'
import type { PageSizeOption } from '@/hooks/usePagination'
import { AdminPagination } from '@/components/admin/AdminPagination'

// ── Types ──────────────────────────────────────────────────────

type BrandStatus = 'active' | 'merged'

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
  aliases: string[]
  status: BrandStatus
  submitted_by: string | null
  created_at: string
  users: { display_name: string | null } | null
}

// ── Data hooks ─────────────────────────────────────────────────

type BrandCounts = { all: number; active: number; merged: number }

const useAdminBrandCounts = () =>
  useQuery({
    queryKey: ['admin-brand-counts'],
    staleTime: 60_000,
    queryFn: async (): Promise<BrandCounts> => {
      const [all, active, merged] = await Promise.all([
        supabase.from('brands').select('id', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null }>,
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'active') as unknown as Promise<{ count: number | null }>,
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'merged') as unknown as Promise<{ count: number | null }>,
      ])
      return { all: all.count ?? 0, active: active.count ?? 0, merged: merged.count ?? 0 }
    },
  })

const useAdminBrands = (status: string, search: string, page: number, pageSize: number) =>
  useQuery({
    queryKey: ['admin-brands', status, search, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      let query = supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status, submitted_by, created_at, users ( display_name )', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (status !== 'all') query = query.eq('status', status)
      if (search) query = query.or(`name.ilike.%${search}%,name_kana.ilike.%${search}%`)

      const { data, count, error } = await (query as unknown as Promise<{ data: BrandRow[] | null; count: number | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return { items: data ?? [], totalCount: count ?? 0 }
    },
  })

// ── Config ─────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: 'all',    label: 'すべて' },
  { value: 'active', label: '有効' },
  { value: 'merged', label: 'マージ済' },
] as const

const STATUS_CONFIG: Record<BrandStatus, { label: string; borderClass: string; badgeClass: string }> = {
  active: { label: '有効',     borderClass: 'border-l-emerald-400', badgeClass: 'bg-emerald-50 text-emerald-700' },
  merged: { label: 'マージ済', borderClass: 'border-l-border',      badgeClass: 'bg-muted text-muted-foreground' },
}

// ── Sub-components ─────────────────────────────────────────────

interface BrandRowProps {
  brand: BrandRow
  index: number
  onMerge: (id: string) => void
  onRestore: (id: string) => void
  isUpdating: boolean
}

const BrandCard = ({ brand, index, onMerge, onRestore, isUpdating }: BrandRowProps) => {
  const conf = STATUS_CONFIG[brand.status]

  return (
    <div
      className={cn(
        'wish-card-enter group relative border-l-[3px] bg-white editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Index */}
        <span className="w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-headline text-[13px] font-black tracking-tight text-foreground/80">
              {brand.name}
            </p>
            {brand.name_kana && (
              <span className="text-[10px] text-muted-foreground/40">{brand.name_kana}</span>
            )}
            {/* Status badge — mobile inline */}
            <span className={cn('sm:hidden rounded-sm px-1.5 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
              {conf.label}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {brand.aliases.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Tag className="h-2.5 w-2.5 shrink-0" />
                {brand.aliases.join(' · ')}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <User className="h-2.5 w-2.5 shrink-0" />
              {brand.users?.display_name ?? '管理者'}
            </span>
            <span className="tabular-nums text-[10px] text-muted-foreground/30">
              {new Date(brand.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Status badge — desktop */}
        <span className={cn('hidden sm:inline-flex shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
          {conf.label}
        </span>

        {/* Actions — mobile always visible */}
        <div className="flex sm:hidden shrink-0 items-center gap-1.5">
          {brand.status === 'active' && (
            <button
              onClick={() => onMerge(brand.id)}
              disabled={isUpdating}
              title="マージ済にする"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-40"
            >
              <GitMerge className="h-3.5 w-3.5" />
            </button>
          )}
          {brand.status === 'merged' && (
            <button
              onClick={() => onRestore(brand.id)}
              disabled={isUpdating}
              title="有効に戻す"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Actions — desktop hover */}
      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {brand.status === 'active' && (
          <button
            onClick={() => onMerge(brand.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-muted px-2 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-40"
          >
            <GitMerge className="h-3 w-3" />
            マージ済
          </button>
        )}
        {brand.status === 'merged' && (
          <button
            onClick={() => onRestore(brand.id)}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" />
            有効に戻す
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

const AdminBrandsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(PAGE_SIZE_OPTIONS[0])

  const debouncedSearch = useDebounce(search)

  useEffect(() => { setPage(1) }, [statusFilter, debouncedSearch, pageSize])

  const { data, isLoading, error } = useAdminBrands(statusFilter, debouncedSearch, page, pageSize)
  const { data: counts } = useAdminBrandCounts()

  const brands = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handlePageSizeChange = (size: PageSizeOption) => { setPageSize(size); setPage(1) }

  const { mutate: updateBrandStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ brandId, status }: { brandId: string; status: BrandStatus }) => {
      const { error } = await supabase
        .from('brands')
        .update({ status } as never)
        .eq('id', brandId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      queryClient.invalidateQueries({ queryKey: ['admin-brand-counts'] })
      queryClient.invalidateQueries({ queryKey: ['brands-search'] })
      queryClient.invalidateQueries({ queryKey: ['shop-brands'] })
    },
  })

  return (
    <div>
      {/* ── Page header ──────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}
          >
            BRANDS
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
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                — Admin
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                ブランド管理
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Control bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Status filters */}
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => {
                const count = counts?.[f.value] ?? 0
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-wider transition-all',
                      statusFilter === f.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-white text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {f.label}
                    {count > 0 && (
                      <span className={cn(
                        'rounded-sm px-1 tabular-nums text-[9px]',
                        statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground/60',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="ブランド名・カナで絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 rounded-sm border border-border bg-white pl-7 pr-3 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>

            {/* Result count */}
            {debouncedSearch && !isLoading && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                {totalCount} 件
              </span>
            )}
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
          {!isLoading && !error && brands.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                No Brands
              </span>
              <p className="text-xs text-muted-foreground/50">該当するブランドがありません</p>
            </div>
          )}

          {/* List */}
          {!isLoading && brands.length > 0 && (
            <div className="space-y-1.5">
              {brands.map((brand, i) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  index={(page - 1) * pageSize + i}
                  onMerge={(id) => updateBrandStatus({ brandId: id, status: 'merged' })}
                  onRestore={(id) => updateBrandStatus({ brandId: id, status: 'active' })}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminBrandsPage

import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, FileSpreadsheet, ChevronLeft, ExternalLink, Pencil, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ShopRow {
  id: string
  name: string
  status: string
  created_at: string
  areas: { city: string } | null
}

const useAdminShops = (status: string) =>
  useQuery({
    queryKey: ['admin-shops', status],
    queryFn: async () => {
      let query = supabase
        .from('shops')
        .select('id, name, status, created_at, areas ( city )')
        .order('created_at', { ascending: false })
        .limit(100)

      if (status !== 'all') query = query.eq('status', status)

      const { data, error } = await (query as unknown as Promise<{ data: ShopRow[] | null; error: { message: string } | null }>)
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

const STATUS_FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'public', label: '公開' },
  { value: 'pending', label: '審査中' },
  { value: 'private', label: '非公開' },
] as const

const STATUS_CONFIG: Record<string, { label: string; borderClass: string; badgeClass: string }> = {
  public: {
    label: '公開',
    borderClass: 'border-l-emerald-400',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  pending: {
    label: '審査中',
    borderClass: 'border-l-amber-400',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  private: {
    label: '非公開',
    borderClass: 'border-l-border',
    badgeClass: 'bg-muted text-muted-foreground',
  },
}

interface ShopListRowProps {
  shop: ShopRow
  index: number
  onStatusChange: (shopId: string, status: string) => void
  isUpdating: boolean
}

const ShopListRow = ({ shop, index, onStatusChange, isUpdating }: ShopListRowProps) => {
  const conf = STATUS_CONFIG[shop.status] ?? STATUS_CONFIG.private

  return (
    <div
      className={cn(
        'wish-card-enter group relative flex items-center gap-4 border-l-[3px] bg-white px-4 py-3.5 transition-colors hover:bg-muted/30 editorial-shadow',
        conf.borderClass,
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Index */}
      <span className="w-7 shrink-0 font-headline text-[10px] font-black tabular-nums text-muted-foreground/25">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Main info */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate font-headline text-[13px] font-black tracking-tight text-foreground/80">
            {shop.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {shop.areas?.city && (
              <span className="text-[10px] text-muted-foreground/50">{shop.areas.city}</span>
            )}
            <span className="text-[10px] tabular-nums text-muted-foreground/30">
              {new Date(shop.created_at).toLocaleDateString('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span className={cn('shrink-0 rounded-sm px-2 py-0.5 font-headline text-[9px] font-black uppercase tracking-wider', conf.badgeClass)}>
          {conf.label}
        </span>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <Link
          to={`/shops/${shop.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-white"
          title="店舗ページを開く"
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          to={`/admin/shops/${shop.id}/edit`}
          className="flex h-7 w-7 items-center justify-center rounded-sm bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-white"
          title="編集"
        >
          <Pencil className="h-3 w-3" />
        </Link>
        {shop.status !== 'public' && (
          <button
            onClick={() => onStatusChange(shop.id, 'public')}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-emerald-50 px-2 font-headline text-[9px] font-black uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-40"
            title="公開する"
          >
            <Eye className="h-3 w-3" />
            公開
          </button>
        )}
        {shop.status !== 'private' && (
          <button
            onClick={() => onStatusChange(shop.id, 'private')}
            disabled={isUpdating}
            className="flex h-7 items-center gap-1 rounded-sm bg-muted px-2 font-headline text-[9px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:bg-foreground hover:text-white disabled:opacity-40"
            title="非公開にする"
          >
            <EyeOff className="h-3 w-3" />
            非公開
          </button>
        )}
      </div>
    </div>
  )
}

const AdminShopsPage = () => {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: shops, isLoading } = useAdminShops(statusFilter)

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ shopId, status }: { shopId: string; status: string }) => {
      const { error } = await supabase.from('shops').update({ status } as never).eq('id', shopId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const filtered = (shops ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const counts = {
    all: shops?.length ?? 0,
    public: shops?.filter((s) => s.status === 'public').length ?? 0,
    pending: shops?.filter((s) => s.status === 'pending').length ?? 0,
    private: shops?.filter((s) => s.status === 'private').length ?? 0,
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
            SHOPS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <Link
              to="/admin"
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60 w-fit"
            >
              <ChevronLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                  — Admin
                </p>
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  SHOP MGMT
                </h1>
              </div>

              <div className="mb-0.5 flex items-center gap-2">
                <Link
                  to="/admin/shops/bulk"
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-3 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  CSV
                </Link>
                <Link
                  to="/admin/shops/new"
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-3 text-xs font-bold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新規登録
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-16 md:py-10">

          {/* Control bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Status filter */}
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => {
                const count = counts[f.value]
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
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="店舗名で絞り込み"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 rounded-sm border border-border bg-white pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-sm bg-muted"
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              ))}
            </div>
          )}

          {/* Column header */}
          {!isLoading && filtered.length > 0 && (
            <div className="mb-2 flex items-center gap-4 px-4">
              <span className="w-7 shrink-0" />
              <div className="flex flex-1 items-center gap-3">
                <span className="flex-1 font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                  店舗名 / エリア
                </span>
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                  Status
                </span>
              </div>
              <span className="w-32 shrink-0 text-right font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                Actions
              </span>
            </div>
          )}

          {/* Shop list */}
          {!isLoading && (
            <div className="space-y-1.5">
              {filtered.map((shop, i) => (
                <ShopListRow
                  key={shop.id}
                  shop={shop}
                  index={i}
                  onStatusChange={(shopId, status) => updateStatus({ shopId, status })}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <div className="py-20 text-center">
              <p
                className="font-headline font-black text-muted-foreground"
                style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0 SHOPS
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {search ? `"${search}" に一致する店舗が見つかりません` : '店舗が登録されていません'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
                >
                  絞り込みをリセット
                </button>
              )}
            </div>
          )}

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="font-headline text-[10px] font-black tabular-nums text-muted-foreground/30">
                {String(filtered.length).padStart(3, '0')} RESULTS
              </span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 transition-colors hover:text-primary"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default AdminShopsPage

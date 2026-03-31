import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useShops } from '@/hooks/useShops'
import { useUiStore } from '@/store/uiStore'
import { ShopCard } from '@/components/shop/ShopCard'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { ShopFilters, Area, Category, PriceRange } from '@/types'

interface MasterData {
  areas: Area[]
  categories: Category[]
  priceRanges: PriceRange[]
}

const fetchMasterData = async (): Promise<MasterData> => {
  const [areasRes, catsRes, pricesRes] = await Promise.all([
    supabase.from('areas').select('id, prefecture, city, slug').order('id') as unknown as Promise<{
      data: Area[] | null
      error: { message: string } | null
    }>,
    supabase.from('categories').select('id, code, name').order('id') as unknown as Promise<{
      data: Category[] | null
      error: { message: string } | null
    }>,
    supabase.from('price_ranges').select('id, label, min_price, max_price').order('id') as unknown as Promise<{
      data: (Omit<PriceRange, 'minPrice' | 'maxPrice'> & { min_price: number | null; max_price: number | null })[] | null
      error: { message: string } | null
    }>,
  ])
  return {
    areas: areasRes.data ?? [],
    categories: catsRes.data ?? [],
    priceRanges: (pricesRes.data ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      minPrice: p.min_price,
      maxPrice: p.max_price,
    })),
  }
}

const SORT_OPTIONS: { value: NonNullable<ShopFilters['sort']>; label: string }[] = [
  { value: 'popular', label: '人気順' },
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '高評価順' },
]

const FilterSelect = ({
  value,
  onChange,
  placeholder,
  isActive,
  children,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  isActive: boolean
  children: React.ReactNode
}) => (
  <div className="relative shrink-0">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 appearance-none rounded-sm border pl-3 pr-7 text-xs font-bold transition-all focus:outline-none',
        isActive
          ? 'border-white/70 bg-white text-primary'
          : 'border-white/20 bg-transparent text-white/55 hover:border-white/40 hover:text-white/80'
      )}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
    <ChevronDown
      className={cn(
        'pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2',
        isActive ? 'text-primary' : 'text-white/35'
      )}
    />
  </div>
)

const ShopsPage = () => {
  const { shopFilters, setShopFilters } = useUiStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useShops(shopFilters)
  const { data: master } = useQuery({
    queryKey: ['master-data'],
    queryFn: fetchMasterData,
    staleTime: Infinity,
  })

  const shops = data?.pages.flatMap((p) => p.items) ?? []
  const activeSort = shopFilters.sort ?? 'popular'
  const hasActiveFilters =
    shopFilters.areaId != null ||
    shopFilters.categoryId != null ||
    shopFilters.priceRangeId != null

  const update = (partial: Partial<ShopFilters>) =>
    setShopFilters({ ...shopFilters, ...partial })

  return (
    <div>
      {/* ── Page header (scrolls away) ──────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        {/* Decorative watermark */}
        <div className="pointer-events-none absolute bottom-0 right-0 select-none translate-y-1/4 pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            SHOPS
          </span>
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-end justify-between pb-6">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                — Archive
              </p>
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                ALL SHOPS
              </h1>
            </div>
            {shops.length > 0 && !isLoading && (
              <span className="mb-0.5 font-headline text-[11px] font-black tabular-nums text-white/25">
                {String(shops.length).padStart(3, '0')}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Sticky filter bar (dark) ────────────────── */}
      <div className="sticky top-14 z-40 border-b border-white/10 bg-primary">
        <div className="mx-auto max-w-6xl px-4 md:px-16">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-3">
            {/* Sort tabs */}
            <div className="flex shrink-0 items-center gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ sort: opt.value })}
                  className={cn(
                    'h-8 rounded-sm px-3 text-xs font-bold transition-all',
                    activeSort === opt.value
                      ? 'border border-white/30 bg-white/15 text-white'
                      : 'border border-white/15 text-white/45 hover:border-white/30 hover:text-white/75'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mx-1 h-4 w-px shrink-0 bg-white/15" />

            <FilterSelect
              value={shopFilters.areaId?.toString() ?? ''}
              onChange={(v) => update({ areaId: v ? Number(v) : undefined })}
              placeholder="エリア"
              isActive={shopFilters.areaId != null}
            >
              {master?.areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.city}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={shopFilters.categoryId?.toString() ?? ''}
              onChange={(v) => update({ categoryId: v ? Number(v) : undefined })}
              placeholder="カテゴリ"
              isActive={shopFilters.categoryId != null}
            >
              {master?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={shopFilters.priceRangeId?.toString() ?? ''}
              onChange={(v) => update({ priceRangeId: v ? Number(v) : undefined })}
              placeholder="価格帯"
              isActive={shopFilters.priceRangeId != null}
            >
              {master?.priceRanges.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.label}
                </option>
              ))}
            </FilterSelect>

            {hasActiveFilters && (
              <>
                <div className="mx-1 h-4 w-px shrink-0 bg-white/15" />
                <button
                  onClick={() => setShopFilters({ sort: shopFilters.sort })}
                  className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white"
                >
                  クリア
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Shop grid ──────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
              {/* Featured skeleton */}
              <div className="col-span-2 animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="border-t border-border bg-background px-3 py-3">
                  <div className="mb-1.5 h-3.5 w-3/4 rounded-sm bg-muted" />
                  <div className="h-2.5 w-1/2 rounded-sm bg-muted" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted" />
                  <div className="border-t border-border bg-background px-3 py-3">
                    <div className="mb-1.5 h-3.5 w-3/4 rounded-sm bg-muted" />
                    <div className="h-2.5 w-1/2 rounded-sm bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="border border-border bg-white p-10 text-center">
              <p className="text-sm text-muted-foreground">
                店舗の読み込みに失敗しました。再度お試しください。
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && shops.length === 0 && (
            <div className="py-24 text-center">
              <p
                className="font-headline font-black text-muted-foreground"
                style={{ fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0 SHOPS
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                条件に合う店舗が見つかりませんでした
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => setShopFilters({ sort: shopFilters.sort })}
                  className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {!isLoading && shops.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
              {shops.map((shop, i) => {
                const isFeatured = i === 0 && !hasActiveFilters
                return (
                  <div key={shop.id} className={isFeatured ? 'col-span-2' : ''}>
                    <ShopCard shop={shop} featured={isFeatured} />
                  </div>
                )
              })}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-14 flex items-center gap-6">
              <div className="h-px flex-1 bg-border" />
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="shrink-0 text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
              >
                {isFetchingNextPage ? '読み込み中...' : 'もっと見る'}
              </button>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopsPage

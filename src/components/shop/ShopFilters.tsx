import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ShopFilters, Area, Category, PriceRange } from '@/types'

interface ShopFiltersProps {
  filters: ShopFilters
  onChange: (filters: ShopFilters) => void
}

const fetchMasterData = async () => {
  const [areas, categories, priceRanges] = await Promise.all([
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
    areas: areas.data ?? [],
    categories: categories.data ?? [],
    priceRanges: (priceRanges.data ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      minPrice: p.min_price,
      maxPrice: p.max_price,
    })) as PriceRange[],
  }
}

const SORT_OPTIONS: { value: ShopFilters['sort']; label: string }[] = [
  { value: 'popular', label: '人気順' },
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '高評価順' },
]

export const ShopFiltersPanel = ({ filters, onChange }: ShopFiltersProps) => {
  const { data } = useQuery({
    queryKey: ['master-data'],
    queryFn: fetchMasterData,
    staleTime: Infinity,
  })

  const update = (partial: Partial<ShopFilters>) => {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Sort */}
      <select
        value={filters.sort ?? 'popular'}
        onChange={(e) => update({ sort: e.target.value as ShopFilters['sort'] })}
        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Prefecture */}
      <select
        value={filters.prefecture ?? ''}
        onChange={(e) =>
          update({ prefecture: e.target.value || undefined })
        }
        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">都道府県: すべて</option>
        {[...new Set(data?.areas.map((a) => a.prefecture) ?? [])].map((pref) => (
          <option key={pref} value={pref}>
            {pref}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        value={filters.categoryId ?? ''}
        onChange={(e) =>
          update({ categoryId: e.target.value ? Number(e.target.value) : undefined })
        }
        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">カテゴリ: すべて</option>
        {data?.categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Price Range */}
      <select
        value={filters.priceRangeId ?? ''}
        onChange={(e) =>
          update({ priceRangeId: e.target.value ? Number(e.target.value) : undefined })
        }
        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">価格帯: すべて</option>
        {data?.priceRanges.map((pr) => (
          <option key={pr.id} value={pr.id}>
            {pr.label}
          </option>
        ))}
      </select>
    </div>
  )
}

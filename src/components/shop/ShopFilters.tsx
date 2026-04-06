import { useShopMasterData } from '@/hooks/useShopMasterData'
import type { ShopFilters } from '@/types'

interface ShopFiltersProps {
  filters: ShopFilters
  onChange: (filters: ShopFilters) => void
}

const SORT_OPTIONS: { value: ShopFilters['sort']; label: string }[] = [
  { value: 'popular', label: '人気順' },
  { value: 'newest', label: '新着順' },
  { value: 'rating', label: '高評価順' },
]

export const ShopFiltersPanel = ({ filters, onChange }: ShopFiltersProps) => {
  const { data } = useShopMasterData()

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
        value={filters.prefectureId ?? ''}
        onChange={(e) =>
          update({ prefectureId: e.target.value ? Number(e.target.value) : undefined })
        }
        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">都道府県: すべて</option>
        {data?.prefectures?.map((pref) => (
          <option key={pref.id} value={pref.id}>
            {pref.name}
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

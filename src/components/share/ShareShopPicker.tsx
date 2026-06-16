import { useEffect, useState } from 'react'
import { X, Store, Search } from 'lucide-react'
import { useShopSearch } from '@/hooks/useShopSearch'

export interface PickedShop {
  id: string
  name: string
}

const MAX_SHOPS = 5

interface ShareShopPickerProps {
  selected: PickedShop[]
  onChange: (shops: PickedShop[]) => void
}

export const ShareShopPicker = ({ selected, onChange }: ShareShopPickerProps) => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, isFetching } = useShopSearch(debounced)
  const selectedIds = new Set(selected.map((s) => s.id))
  const candidates = (results ?? []).filter((s) => !selectedIds.has(s.id)).slice(0, 8)
  const atMax = selected.length >= MAX_SHOPS

  const add = (shop: PickedShop) => {
    if (atMax) return
    onChange([...selected, { id: shop.id, name: shop.name }])
    setQuery('')
    setDebounced('')
  }

  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id))

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((shop) => (
            <span
              key={shop.id}
              className="inline-flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/5 py-1 pl-2.5 pr-1 text-[11px] font-bold text-foreground/80"
            >
              <Store className="h-3 w-3 text-primary/50" />
              {shop.name}
              <button
                type="button"
                onClick={() => remove(shop.id)}
                className="rounded-sm p-0.5 text-muted-foreground/50 hover:text-red-500"
                aria-label={`${shop.name} を外す`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!atMax ? (
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="店舗名で検索（2文字以上）"
              className="h-10 w-full rounded-sm border border-border bg-white pl-9 pr-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          {debounced.trim().length >= 2 && (
            <div className="mt-1 overflow-hidden rounded-sm border border-border bg-white">
              {isFetching ? (
                <p className="px-3 py-2 text-[11px] text-muted-foreground/40">検索中…</p>
              ) : candidates.length > 0 ? (
                candidates.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => add({ id: shop.id, name: shop.name })}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-foreground/80 transition-colors hover:bg-muted/50"
                  >
                    <Store className="h-3.5 w-3.5 text-muted-foreground/40" />
                    {shop.name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-[11px] text-muted-foreground/40">該当する店舗がありません</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/50">
          関連店舗は最大 {MAX_SHOPS} 件までです。
        </p>
      )}
    </div>
  )
}

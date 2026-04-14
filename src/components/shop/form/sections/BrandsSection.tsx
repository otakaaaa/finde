import { useState, useRef, useEffect } from 'react'
import { Search, Tag, X, Plus } from 'lucide-react'
import { useSearchBrands } from '@/hooks/useBrands'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'

interface BrandsSectionProps {
  num: string
  onBrandsChange: (brands: Brand[]) => void
  animationDelay?: string
}

export const BrandsSection = ({
  num,
  onBrandsChange,
  animationDelay = '90ms',
}: BrandsSectionProps) => {
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([])
  const [inputValue, setInputValue] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: searchResults = [], isFetching } = useSearchBrands(committedQuery)

  const selectedIds = new Set(selectedBrands.map((b) => b.id))
  const filteredResults = searchResults.filter((b) => !selectedIds.has(b.id))

  const handleSearch = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setCommittedQuery(trimmed)
    setDropdownOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const addBrand = (brand: Brand) => {
    const next = [...selectedBrands, brand]
    setSelectedBrands(next)
    onBrandsChange(next)
    setDropdownOpen(false)
    setInputValue('')
    setCommittedQuery('')
    inputRef.current?.focus()
  }

  const removeBrand = (id: string) => {
    const next = selectedBrands.filter((b) => b.id !== id)
    setSelectedBrands(next)
    onBrandsChange(next)
  }

  return (
    <section className="wish-card-enter" style={{ animationDelay }}>
      <SectionLabel num={num} title="取扱ブランド" optional />

      <div ref={searchRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              ref={inputRef}
              type="text"
              placeholder="ブランド名を入力…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'h-10 w-full rounded-sm border border-border bg-white pl-9 pr-4 text-sm',
                'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
              )}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('')
                  setCommittedQuery('')
                  setDropdownOpen(false)
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!inputValue.trim() || isFetching}
            className={cn(
              'flex h-10 items-center gap-1.5 bg-primary px-4 text-[11px] font-black uppercase tracking-[0.2em] text-white',
              'transition-opacity hover:opacity-90 disabled:opacity-40',
            )}
          >
            {isFetching ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            検索
          </button>
        </div>

        {dropdownOpen && committedQuery && (
          <div className="relative left-0 right-0 top-full z-50 border border-t-0 border-border bg-white shadow-md">
            {isFetching ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((brand, i) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => addBrand(brand)}
                  className={cn(
                    'flex w-full items-center gap-3 bg-white px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                    'wish-card-enter',
                  )}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <Tag className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  <div className="min-w-0 flex-1">
                    <p className="font-headline text-[12px] font-black tracking-tight text-foreground/80">
                      {brand.name}
                    </p>
                    {brand.nameKana && (
                      <p className="text-[10px] text-muted-foreground/50">{brand.nameKana}</p>
                    )}
                  </div>
                  <Plus className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-[11px] text-muted-foreground/50">
                「{committedQuery}」に一致するブランドが見つかりませんでした
              </p>
            )}
          </div>
        )}
      </div>

      {selectedBrands.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center gap-2 border border-border bg-white px-3 py-1.5 editorial-shadow"
            >
              <span className="font-headline text-[11px] font-black tracking-tight text-foreground/70">
                {brand.name}
              </span>
              {brand.nameKana && (
                <span className="text-[9px] text-muted-foreground/40">{brand.nameKana}</span>
              )}
              <button
                type="button"
                onClick={() => removeBrand(brand.id)}
                className="ml-1 flex h-4 w-4 items-center justify-center text-muted-foreground/30 transition-colors hover:bg-red-50 hover:text-red-500"
                title="削除"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

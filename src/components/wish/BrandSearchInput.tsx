import { useState, useRef, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { useSearchBrands } from '@/hooks/useBrands'

interface BrandSearchInputProps {
  value: string | undefined
  onChange: (brandId: string | undefined) => void
  initialBrandName?: string | null
}

export const BrandSearchInput = ({ value, onChange, initialBrandName }: BrandSearchInputProps) => {
  const [query, setQuery] = useState('')
  const [displayName, setDisplayName] = useState(initialBrandName ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: brands } = useSearchBrands(query)

  useEffect(() => {
    if (!value) setDisplayName('')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (brandId: string, brandName: string) => {
    onChange(brandId)
    setDisplayName(brandName)
    setQuery('')
    setShowDropdown(false)
  }

  const handleClear = () => {
    onChange(undefined)
    setDisplayName('')
    setQuery('')
  }

  if (value && displayName) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/[0.07] px-3 py-1.5 text-[12px] font-black text-primary">
          {displayName}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="flex h-6 w-6 items-center justify-center rounded-sm border border-border text-muted-foreground/50 transition-colors hover:border-red-200 hover:text-red-400"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => query.length >= 1 && setShowDropdown(true)}
          placeholder="ブランド名を入力して検索..."
          className="h-10 w-full rounded-sm border border-border bg-white py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {showDropdown && brands && brands.length > 0 && (
        <div className="absolute z-10 mt-1 w-full border border-border bg-white shadow-md">
          {brands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(brand.id, brand.name)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/[0.04]"
            >
              <span className="font-medium">{brand.name}</span>
              {brand.nameKana && (
                <span className="text-[11px] text-muted-foreground/50">{brand.nameKana}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 1 && brands?.length === 0 && (
        <div className="absolute z-10 mt-1 w-full border border-border bg-white px-3 py-2.5 shadow-md">
          <p className="text-[11px] text-muted-foreground/50">「{query}」に一致するブランドが見つかりません</p>
        </div>
      )}
    </div>
  )
}

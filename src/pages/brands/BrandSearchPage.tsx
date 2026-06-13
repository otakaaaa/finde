import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, X, ArrowUpRight } from 'lucide-react'
import { useBrands } from '@/hooks/useBrands'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'
import { Seo } from '@/components/seo/Seo'

// ── Helpers ─────────────────────────────────────────────────────

const groupByInitial = (brands: Brand[]): Record<string, Brand[]> =>
  brands.reduce<Record<string, Brand[]>>((acc, brand) => {
    const ch = brand.name[0] ?? '#'
    const key = /[A-Za-z]/.test(ch) ? ch.toUpperCase() : ch
    if (!acc[key]) acc[key] = []
    acc[key].push(brand)
    return acc
  }, {})

// Sort keys: ASCII letters first (A–Z), then everything else
const sortKeys = (keys: string[]): string[] => {
  const ascii = keys.filter((k) => /^[A-Z]$/.test(k)).sort()
  const rest = keys.filter((k) => !/^[A-Z]$/.test(k)).sort()
  return [...ascii, ...rest]
}

// ── Page ───────────────────────────────────────────────────────

const BrandSearchPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data: brands, isLoading } = useBrands()

  const filtered = (brands ?? []).filter((b) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      b.name.toLowerCase().includes(q) ||
      (b.nameKana ?? '').toLowerCase().includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q))
    )
  })

  const grouped = groupByInitial(filtered)
  const sortedKeys = sortKeys(Object.keys(grouped))

  const handleSelect = (brand: Brand) => {
    navigate(`/brands/${brand.id}`)
  }

  return (
    <div>
      <Seo
        title="ブランドから探す"
        description="取り扱いブランドからセレクトショップ・古着屋を検索。気になるブランドを扱っているお店をFINDEで見つけられます。"
        path="/brands"
      />
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

        <div className="relative mx-auto max-w-6xl">
          <div className="pb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Archive
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              BRAND INDEX
            </h1>
          </div>
        </div>
      </section>

      {/* ── Sticky search bar ────────────────────── */}
      <div className="sticky top-14 z-40 border-b border-white/10 bg-primary">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-16">
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ブランド名・カナ・別名で絞り込み…"
                className="h-8 w-full border border-white/20 bg-transparent pl-9 pr-8 text-xs text-white placeholder:text-white/30 transition-colors focus:border-white/40 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {query && (
              <span className="shrink-0 font-headline text-[10px] font-black tabular-nums text-white/25">
                {filtered.length} 件
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Brand index ──────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/25">
                No Results
              </p>
              <p className="mt-2 text-xs text-muted-foreground/50">
                「{query}」に一致するブランドが見つかりません
              </p>
            </div>
          )}

          {/* Alphabetical groups */}
          {!isLoading && sortedKeys.map((key) => (
            <div key={key} className="mb-10">
              {/* Group heading */}
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/25">
                  {key}
                </span>
                <span className="h-px flex-1 bg-border" />
                <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/20">
                  {grouped[key].length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {grouped[key].map((brand, i) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelect(brand)}
                    className={cn(
                      'wish-card-enter group flex items-center gap-2 border border-border bg-white px-3 py-2',
                      'transition-all duration-150 hover:border-primary/30 hover:bg-primary/[0.02] editorial-shadow',
                    )}
                    style={{ animationDelay: `${Math.min(i * 12, 300)}ms` }}
                  >
                    <span className="font-headline text-[12px] font-black tracking-tight text-foreground/70 transition-colors group-hover:text-primary/80">
                      {brand.name}
                    </span>
                    {brand.nameKana && (
                      <span className="text-[9px] text-muted-foreground/35">{brand.nameKana}</span>
                    )}
                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0 text-primary/0 transition-all group-hover:text-primary/40" />
                  </button>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default BrandSearchPage

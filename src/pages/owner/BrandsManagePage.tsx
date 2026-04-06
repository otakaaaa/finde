import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Search, Plus, X, Tag, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Brand } from '@/types'

// ── Types ──────────────────────────────────────────────────────

interface ShopBrandRow {
  brands: Brand & { name_kana: string | null; merged_into: string | null; submitted_by: string | null; created_at: string }
}

// ── Data hooks ─────────────────────────────────────────────────

const useShopBrands = (shopId: string) =>
  useQuery({
    queryKey: ['shop-brands', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_brands')
        .select('brands ( id, name, name_kana, aliases, status, merged_into, submitted_by, created_at )')
        .eq('shop_id', shopId) as { data: ShopBrandRow[] | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      return (data ?? []).map(({ brands: b }) => ({
        id: b.id,
        name: b.name,
        nameKana: b.name_kana,
        aliases: b.aliases,
        status: b.status,
        mergedInto: b.merged_into,
        submittedBy: b.submitted_by,
        createdAt: b.created_at,
      })) as Brand[]
    },
    enabled: !!shopId,
  })

const useSearchBrands = (query: string) =>
  useQuery({
    queryKey: ['brands-search', query],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name, name_kana, aliases, status, merged_into, submitted_by, created_at')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(8) as { data: (Omit<Brand, 'nameKana' | 'mergedInto' | 'submittedBy' | 'createdAt'> & { name_kana: string | null; merged_into: string | null; submitted_by: string | null; created_at: string })[] | null; error: unknown }

      return (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        nameKana: b.name_kana,
        aliases: b.aliases,
        status: b.status,
        mergedInto: b.merged_into,
        submittedBy: b.submitted_by,
        createdAt: b.created_at,
      })) as Brand[]
    },
    enabled: query.trim().length >= 2,
  })

// ── Page ───────────────────────────────────────────────────────

const BrandsManagePage = () => {
  const { id: shopId } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const backTo = isAdmin ? `/admin/shops/${shopId}/edit` : `/owner/shops/${shopId}/edit`
  const backLabel = isAdmin ? '店舗編集へ戻る' : '店舗編集へ戻る'
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [_, setNewBrandName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: shopBrands, isLoading } = useShopBrands(shopId ?? '')
  const { data: searchResults } = useSearchBrands(searchQuery)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const existingBrandIds = new Set(shopBrands?.map((b) => b.id) ?? [])
  const filteredResults = searchResults?.filter((b) => !existingBrandIds.has(b.id)) ?? []
  const showDropdown = dropdownOpen && searchQuery.trim().length >= 2

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
    queryClient.invalidateQueries({ queryKey: ['brands-search'] })
    queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    setSearchQuery('')
    setDropdownOpen(false)
  }

  const { mutate: addBrand, isPending: isAdding } = useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase
        .from('shop_brands')
        .insert({ shop_id: shopId, brand_id: brandId } as never) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const { mutate: removeBrand } = useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase
        .from('shop_brands')
        .delete()
        .eq('shop_id', shopId ?? '')
        .eq('brand_id', brandId) as unknown as { data: unknown; error: { message: string } | null }
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
      queryClient.invalidateQueries({ queryKey: ['brands-search'] })
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const { mutate: createAndAddBrand, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('ログインが必要です')

      const { data, error } = await supabase
        .from('brands')
        .insert({ name, submitted_by: user.id, status: 'active' } as never)
        .select('id')
        .single() as unknown as { data: { id: string } | null; error: { message: string } | null }

      if (error) throw new Error(error.message)
      if (!data) throw new Error('ブランドの作成に失敗しました')

      await supabase
        .from('shop_brands')
        .insert({ shop_id: shopId, brand_id: data.id } as never)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-brands', shopId] })
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] })
      setSearchQuery('')
      setNewBrandName('')
      setDropdownOpen(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const isBusy = isAdding || isCreating

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

        <div className="relative mx-auto max-w-3xl">
          <div className="pb-6">
            <Link
              to={backTo}
              className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              {backLabel}
            </Link>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
              — Owner
            </p>
            <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
              BRAND REGISTER
            </h1>
          </div>
        </div>
      </section>

      {/* ── Content ──────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-16 md:py-14">

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-medium text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Search & Add ─────────────────────── */}
          <section className="mb-10">
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                ブランドを追加
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div ref={searchRef} className="relative">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ブランド名で検索…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDropdownOpen(true)
                    setError(null)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className={cn(
                    'h-11 w-full border border-border bg-white pl-9 pr-4 text-sm',
                    'placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50',
                    'transition-all',
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setDropdownOpen(false); inputRef.current?.focus() }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 top-full z-10 border border-t-0 border-border bg-white editorial-shadow">
                  {filteredResults.length > 0 ? (
                    <>
                      <div className="px-3 pt-2 pb-1">
                        <span className="font-headline text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                          検索結果
                        </span>
                      </div>
                      {filteredResults.map((brand, i) => (
                        <button
                          key={brand.id}
                          onClick={() => addBrand(brand.id)}
                          disabled={isBusy}
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                            'wish-card-enter',
                          )}
                          style={{ animationDelay: `${i * 30}ms` }}
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
                      ))}
                    </>
                  ) : null}

                  {/* Create new brand — only when no matches */}
                  {filteredResults.length === 0 && searchQuery.trim().length >= 2 && (
                    <button
                      onClick={() => createAndAddBrand(searchQuery.trim())}
                      disabled={isBusy}
                      className="flex w-full items-center gap-3 border-t border-border px-3 py-3 text-left transition-colors hover:bg-primary/[0.03]"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <div className="flex-1">
                        <p className="font-headline text-[11px] font-black tracking-wide text-primary/70">
                          「{searchQuery.trim()}」を新規登録して追加
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                          見つからない場合は新しく作成できます
                        </p>
                      </div>
                      {isBusy && (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Registered brands ────────────────── */}
          <section>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                登録済みブランド
              </span>
              {(shopBrands?.length ?? 0) > 0 && (
                <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/30">
                  {String(shopBrands!.length).padStart(2, '0')}
                </span>
              )}
              <span className="h-px flex-1 bg-border" />
            </div>

            {isLoading && (
              <div className="flex justify-center py-10">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!isLoading && shopBrands?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="font-headline text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">
                  No Brands
                </span>
                <p className="text-xs text-muted-foreground/40">上の検索欄からブランドを追加してください</p>
              </div>
            )}

            {!isLoading && (shopBrands?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {shopBrands?.map((brand, i) => (
                  <div
                    key={brand.id}
                    className="wish-card-enter flex items-center gap-2 border border-border bg-white px-3 py-2 editorial-shadow"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="font-headline text-[11px] font-black tracking-tight text-foreground/70">
                      {brand.name}
                    </span>
                    {brand.nameKana && (
                      <span className="text-[9px] text-muted-foreground/40">{brand.nameKana}</span>
                    )}
                    <button
                      onClick={() => removeBrand(brand.id)}
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground/30 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="削除"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}

export default BrandsManagePage

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, Shirt, ShoppingBag, Baby, Users, Sparkles, ArrowUpRight, Search, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShops } from '@/hooks/useShops'
import { useBrands } from '@/hooks/useBrands'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { ShopSearchBar } from '@/components/shop/ShopSearchBar'
import type { Category, CategoryCode, Prefecture, Shop } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=600&height=450&resize=cover`

const CATEGORY_ICONS: Record<CategoryCode, ReactNode> = {
  mens: <Shirt className="h-5 w-5" />,
  ladies: <ShoppingBag className="h-5 w-5" />,
  kids: <Baby className="h-5 w-5" />,
  unisex: <Users className="h-5 w-5" />,
  vintage: <Sparkles className="h-5 w-5" />,
}

const REGIONS: { label: string; labelEn: string; ids: number[] }[] = [
  { label: '北海道', labelEn: 'HOKKAIDO', ids: [1] },
  { label: '東北',   labelEn: 'TOHOKU',   ids: [2, 3, 4, 5, 6, 7] },
  { label: '関東',   labelEn: 'KANTO',    ids: [8, 9, 10, 11, 12, 13, 14] },
  { label: '中部',   labelEn: 'CHUBU',    ids: [15, 16, 17, 18, 19, 20, 21, 22, 23] },
  { label: '近畿',   labelEn: 'KINKI',    ids: [24, 25, 26, 27, 28, 29, 30] },
  { label: '中国',   labelEn: 'CHUGOKU',  ids: [31, 32, 33, 34, 35] },
  { label: '四国',   labelEn: 'SHIKOKU',  ids: [36, 37, 38, 39] },
  { label: '九州・沖縄', labelEn: 'KYUSHU', ids: [40, 41, 42, 43, 44, 45, 46, 47] },
]

const usePrefectures = () =>
  useQuery({
    queryKey: ['prefectures'],
    queryFn: async () => {
      const result = await supabase
        .from('prefectures')
        .select('id, name, name_en, region, slug')
        .order('id') as unknown as { data: ({ id: number; name: string; name_en: string; region: string; slug: string })[] | null; error: { message: string } | null }
      if (result.error) throw new Error(result.error.message)
      return (result.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        nameEn: p.name_en,
        region: p.region,
        slug: p.slug,
      })) as Prefecture[]
    },
    staleTime: Infinity,
  })

const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await supabase
        .from('categories')
        .select('id, code, name')
        .order('id') as unknown as { data: Category[] | null; error: { message: string } | null }
      if (result.error) throw new Error(result.error.message)
      return result.data ?? []
    },
    staleTime: Infinity,
  })

interface TopStats {
  shopCount: number
  areaCount: number
}

const useTopStats = () =>
  useQuery<TopStats>({
    queryKey: ['top-stats'],
    queryFn: async () => {
      const [shopsRes, areasRes] = await Promise.all([
        supabase
          .from('shops')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'public') as unknown as Promise<{ count: number | null; error: { message: string } | null }>,
        supabase
          .from('areas')
          .select('*', { count: 'exact', head: true }) as unknown as Promise<{ count: number | null; error: { message: string } | null }>,
      ])
      return {
        shopCount: shopsRes.count ?? 0,
        areaCount: areasRes.count ?? 0,
      }
    },
    staleTime: 10 * 60 * 1000,
  })

interface FeaturedCardProps {
  shop: Shop
  variant?: 'large' | 'small'
}

const FeaturedCard = ({ shop, variant = 'small' }: FeaturedCardProps) => {
  const coverPhoto = shop.photos[0]
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group relative block overflow-hidden bg-muted"
    >
      <div className={variant === 'large' ? 'relative h-[480px] overflow-hidden' : 'relative h-64 overflow-hidden'}>
        {coverPhoto ? (
          <img
            src={getPhotoUrl(coverPhoto.storagePath)}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-5xl">🏪</div>
        )}

        <div className="absolute inset-0 bg-primary/0 transition-all duration-500 group-hover:bg-primary/80" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <div className="translate-y-3 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="font-headline text-base font-black leading-tight text-white">{shop.name}</p>
            {shop.area && (
              <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-white/60">
                <MapPin className="h-2.5 w-2.5" />
                {shop.area.city}
              </p>
            )}
          </div>
        </div>

        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center bg-white/0 opacity-0 transition-all duration-300 group-hover:bg-white group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      {/* Info bar */}
      <div className="relative border-t border-border bg-background px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-headline text-sm font-bold">{shop.name}</h3>
            {shop.area && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{shop.area.city}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {shop.averageRating && (
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-amber-500" />
                <span className="text-xs font-bold">{shop.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        {variant === 'large' && shop.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {shop.description}
          </p>
        )}
      </div>

      {/* Category tag */}
      {shop.categories[0] && (
        <div className="absolute left-3 top-3">
          <span className="rounded-sm bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
            {shop.categories[0].name}
          </span>
        </div>
      )}
    </Link>
  )
}

const TOP_BRAND_LIMIT = 40

const TopPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setShopFilters } = useUiStore()
  const { data: prefectures } = usePrefectures()
  const { data: categories } = useCategories()
  const { data: stats } = useTopStats()
  const { data: popularData } = useShops({ sort: 'popular' })
  const { data: brands } = useBrands()
  const [brandQuery, setBrandQuery] = useState('')

  const featuredShops = popularData?.pages[0]?.items.slice(0, 5) ?? []

  const goWithCategory = (categoryId: number) => {
    setShopFilters({ sort: 'popular', categoryId })
    navigate('/shops')
  }

  const goWithPrefecture = (prefectureId: number) => {
    setShopFilters({ sort: 'popular', prefectureId })
    navigate('/shops')
  }

  const goWithBrand = (brandId: string, brandName: string) => {
    setShopFilters({ sort: 'popular', brandId, brandName })
    navigate('/shops')
  }

  const displayBrands = (brands ?? []).filter((b) => {
    if (!brandQuery) return true
    const q = brandQuery.toLowerCase()
    return (
      b.name.toLowerCase().includes(q) ||
      (b.nameKana ?? '').toLowerCase().includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q))
    )
  }).slice(0, brandQuery ? 100 : TOP_BRAND_LIMIT)

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] bg-primary overflow-hidden flex flex-col justify-center pb-16 pt-24">
        {/* Decorative large kanji */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-2vw] top-[-4vw] select-none font-headline font-black leading-none text-white"
          style={{ fontSize: 'clamp(12rem, 40vw, 36rem)', opacity: 0.03 }}
        >
          服
        </div>

        {/* Thin horizontal rule at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

        {/* Volume indicator — left edge */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3">
          <div className="h-16 w-px bg-white/20" />
          <span
            className="text-white/30 text-[9px] font-bold tracking-[0.5em] uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            FUKUNAVI — 2026
          </span>
          <div className="h-16 w-px bg-white/20" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-8 md:px-16">
          {/* Eyebrow */}
          <div className="mb-10 flex items-center gap-4">
            <div className="h-px w-8 bg-white/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/50">
              Select Shop Navigator
            </span>
          </div>

          {/* Main headline — offset staggered */}
          <div className="mb-14 overflow-hidden">
            <h1 className="font-headline font-black text-white leading-[0.88] tracking-tighter">
              <span
                className="block"
                style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)' }}
              >
                FIND
              </span>
              <span
                className="block"
                style={{
                  fontSize: 'clamp(3.5rem, 11vw, 10rem)',
                  paddingLeft: 'clamp(2rem, 8vw, 8rem)',
                }}
              >
                YOUR
              </span>
              <span
                className="block"
                style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)' }}
              >
                STYLE.
              </span>
            </h1>
          </div>

          {/* Bottom row: description + search */}
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="max-w-xs text-sm leading-relaxed text-white/60">
                全国のセレクトショップ・古着屋を、<br />
                エリアやブランドから探せる。
              </p>
            </div>
            <div className="w-full max-w-lg">
              <ShopSearchBar className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ticker ─────────────────────────────────── */}
      {stats && (stats.shopCount > 0 || stats.areaCount > 0) && (
        <section className="overflow-hidden border-b border-border bg-background">
          <div className="mx-auto max-w-6xl px-4 md:px-16">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="py-6 pr-4 md:py-8 md:pr-8">
                <div className="font-headline font-black tabular-nums leading-none text-[1.75rem] md:text-[2.5rem]">
                  {stats.shopCount.toLocaleString()}
                </div>
                <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground md:mt-2 md:tracking-[0.3em]">
                  掲載店舗数
                </div>
              </div>
              <div className="px-4 py-6 md:px-8 md:py-8">
                <div className="font-headline font-black tabular-nums leading-none text-[1.75rem] md:text-[2.5rem]">
                  {stats.areaCount}
                  <span className="text-base md:text-xl">+</span>
                </div>
                <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground md:mt-2 md:tracking-[0.3em]">
                  対象エリア
                </div>
              </div>
              <div className="pl-4 py-6 md:pl-8 md:py-8">
                <div className="font-headline font-black leading-none text-[1.75rem] md:text-[2.5rem]">無料</div>
                <div className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground md:mt-2 md:tracking-[0.3em]">
                  ご利用料金
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Categories — Magazine index style ────────────── */}
      {categories && categories.length > 0 && (
        <section className="bg-white py-24 border-b border-border">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="mb-12 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
                  — Browse
                </span>
                <h2 className="font-headline mt-2 text-4xl font-black md:text-5xl">
                  カテゴリ
                </h2>
              </div>
            </div>

            <div className="divide-y divide-border">
              {categories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => goWithCategory(cat.id)}
                  className="group flex w-full items-center justify-between py-5 transition-all duration-200 hover:pl-3"
                >
                  <div className="flex items-center gap-6">
                    <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-muted-foreground transition-colors group-hover:text-primary">
                      {CATEGORY_ICONS[cat.code as CategoryCode] ?? <Shirt className="h-5 w-5" />}
                    </span>
                    <span className="font-headline text-2xl font-bold transition-colors group-hover:text-primary md:text-3xl">
                      {cat.name}
                    </span>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands ───────────────────────────────────────── */}
      {brands && brands.length > 0 && (
        <section className="border-b border-border bg-foreground py-20">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            {/* Header */}
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                  — By Brand
                </span>
                <h2 className="font-headline mt-2 text-4xl font-black text-white md:text-5xl">
                  ブランドで探す
                </h2>
              </div>
              <Link
                to="/brands"
                className="group flex shrink-0 items-center gap-1 text-sm font-bold text-white/40 transition-colors hover:text-white"
              >
                すべて見る
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="ブランド名で絞り込み…"
                className="h-10 w-full border border-white/10 bg-white/[0.04] pl-9 pr-9 text-sm text-white placeholder:text-white/20 transition-colors focus:border-white/25 focus:bg-white/[0.07] focus:outline-none"
              />
              {brandQuery && (
                <button
                  onClick={() => setBrandQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Brand tags */}
            {displayBrands.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {displayBrands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => goWithBrand(brand.id, brand.name)}
                    className="border border-white/10 bg-white/[0.03] px-3 py-1.5 font-headline text-[11px] font-black text-white/50 tracking-wide transition-all hover:border-white/30 hover:bg-white/[0.09] hover:text-white"
                  >
                    {brand.name}
                  </button>
                ))}
                {!brandQuery && brands.length > TOP_BRAND_LIMIT && (
                  <Link
                    to="/brands"
                    className="border border-white/10 px-3 py-1.5 font-headline text-[11px] font-black text-primary/50 tracking-wide transition-all hover:border-primary/30 hover:text-primary/80"
                  >
                    +{brands.length - TOP_BRAND_LIMIT} 件
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/30">
                「{brandQuery}」に一致するブランドが見つかりません
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Featured shops — Asymmetric editorial grid ───── */}
      {featuredShops.length > 0 && (
        <section className="bg-muted py-24">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
                  — Curated
                </span>
                <h2 className="font-headline mt-2 text-4xl font-black md:text-5xl">
                  注目の店舗
                </h2>
              </div>
              <Link
                to="/shops"
                onClick={() => setShopFilters({ sort: 'popular' })}
                className="group flex items-center gap-1 text-sm font-bold text-primary"
              >
                すべて見る
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Asymmetric grid: 1 large left + 2 small right, then 2 small bottom */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Large feature card */}
              {featuredShops[0] && (
                <div className="md:col-span-2 md:row-span-2">
                  <FeaturedCard shop={featuredShops[0]} variant="large" />
                </div>
              )}
              {/* Small cards */}
              {featuredShops.slice(1, 3).map((shop) => (
                <div key={shop.id}>
                  <FeaturedCard shop={shop} />
                </div>
              ))}
              {/* Bottom row */}
              {featuredShops.slice(3, 5).map((shop) => (
                <div key={shop.id}>
                  <FeaturedCard shop={shop} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Prefectures ──────────────────────────────────── */}
      {prefectures && prefectures.length > 0 && (
        <section className="border-b border-border bg-background py-20">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/50">
                  — Location
                </span>
                <h2 className="font-headline mt-1.5 text-4xl font-black leading-none md:text-5xl">
                  都道府県から探す
                </h2>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              {REGIONS.map((region) => {
                const regionPrefs = prefectures.filter((p) => region.ids.includes(p.id))
                return (
                  <div key={region.label} className="flex gap-4 py-3 sm:gap-8">
                    {/* Region label */}
                    <div className="w-16 shrink-0 pt-0.5 sm:w-20">
                      <div className="font-headline text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                        {region.labelEn}
                      </div>
                      <div className="mt-0.5 text-[11px] font-bold text-foreground/40">
                        {region.label}
                      </div>
                    </div>

                    {/* Prefecture chips */}
                    <div className="flex flex-wrap gap-1.5 py-0.5">
                      {regionPrefs.map((pref) => (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => goWithPrefecture(pref.id)}
                          className={[
                            'rounded-sm border border-border/60 px-2.5 py-1 text-[11px] font-bold',
                            'text-foreground/60 transition-all duration-150',
                            'hover:border-primary hover:bg-primary hover:text-white',
                          ].join(' ')}
                        >
                          {pref.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────── */}
      {!user && (
        <section className="bg-primary py-28">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
                  — Join Us
                </span>
                <h2 className="font-headline mt-4 max-w-lg text-4xl font-black text-white leading-tight md:text-5xl">
                  理想の一着との出会いを、ここから。
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
                  会員登録して、お気に入りのショップを保存したり、
                  新着情報の通知を受け取りましょう。
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-white px-8 py-4 text-sm font-bold text-primary transition-opacity hover:opacity-90"
                >
                  無料で始める
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center rounded-sm border border-white/20 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
                >
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default TopPage

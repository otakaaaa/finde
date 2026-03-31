import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, Heart, Shirt, ShoppingBag, Baby, Users, Sparkles, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShops } from '@/hooks/useShops'
import { useAuth } from '@/hooks/useAuth'
import { useUiStore } from '@/store/uiStore'
import { ShopSearchBar } from '@/components/shop/ShopSearchBar'
import type { Area, Category, CategoryCode, Shop } from '@/types'

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

const CITY_ROMAJI: Record<string, string> = {
  '渋谷': 'Shibuya',
  '新宿': 'Shinjuku',
  '港': 'Minato',
  '中目黒': 'Nakameguro',
  '代官山': 'Daikanyama',
  '三軒茶屋': 'Sangenjaya',
  '恵比寿': 'Ebisu',
  '吉祥寺': 'Kichijoji',
  '下北沢': 'Shimokitazawa',
  '原宿': 'Harajuku',
  '表参道': 'Omotesando',
  '銀座': 'Ginza',
  '六本木': 'Roppongi',
  '池袋': 'Ikebukuro',
  '上野': 'Ueno',
  '秋葉原': 'Akihabara',
  '浅草': 'Asakusa',
  '品川': 'Shinagawa',
  '大阪': 'Osaka',
  '梅田': 'Umeda',
  '心斎橋': 'Shinsaibashi',
  '難波': 'Namba',
  '名古屋': 'Nagoya',
  '福岡': 'Fukuoka',
  '天神': 'Tenjin',
  '京都': 'Kyoto',
  '神戸': 'Kobe',
  '横浜': 'Yokohama',
  '札幌': 'Sapporo',
  '仙台': 'Sendai',
  '広島': 'Hiroshima',
}

const useAreas = () =>
  useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const result = await supabase
        .from('areas')
        .select('id, prefecture, city, slug')
        .order('id') as unknown as { data: Area[] | null; error: { message: string } | null }
      if (result.error) throw new Error(result.error.message)
      return result.data ?? []
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
      <div className={variant === 'large' ? 'h-[480px]' : 'h-64'}>
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
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-primary/0 transition-all duration-500 group-hover:bg-primary/40" />
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
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:text-primary">
              <Heart className="h-3 w-3" />
            </div>
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

const TopPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setShopFilters } = useUiStore()
  const { data: areas } = useAreas()
  const { data: categories } = useCategories()
  const { data: stats } = useTopStats()
  const { data: popularData } = useShops({ sort: 'popular' })

  const featuredShops = popularData?.pages[0]?.items.slice(0, 5) ?? []

  const goWithCategory = (categoryId: number) => {
    setShopFilters({ sort: 'popular', categoryId })
    navigate('/shops')
  }

  const goWithArea = (areaId: number) => {
    setShopFilters({ sort: 'popular', areaId })
    navigate('/shops')
  }

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
                エリアやカテゴリから探せる。
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
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="py-8 pr-8">
                <div className="font-headline text-[2.5rem] font-black tabular-nums leading-none">
                  {stats.shopCount.toLocaleString()}
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  掲載店舗数
                </div>
              </div>
              <div className="px-8 py-8">
                <div className="font-headline text-[2.5rem] font-black tabular-nums leading-none">
                  {stats.areaCount}
                  <span className="text-xl">+</span>
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  対象エリア
                </div>
              </div>
              <div className="pl-8 py-8">
                <div className="font-headline text-[2.5rem] font-black leading-none">無料</div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
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

      {/* ── Areas ────────────────────────────────────────── */}
      {areas && areas.length > 0 && (
        <section className="bg-white py-24 border-b border-border">
          <div className="mx-auto max-w-6xl px-8 md:px-16">
            <div className="mb-12">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">
                — Location
              </span>
              <h2 className="font-headline mt-2 text-4xl font-black md:text-5xl">
                エリアで探す
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {areas.slice(0, 8).map((area) => (
                <button
                  key={area.id}
                  onClick={() => goWithArea(area.id)}
                  className="group relative overflow-hidden border border-border bg-background p-5 text-left transition-all duration-200 hover:border-primary hover:bg-primary"
                >
                  <div className="relative z-10">
                    <div className="font-headline text-lg font-bold transition-colors group-hover:text-primary-foreground">
                      {area.city}
                    </div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground transition-colors group-hover:text-primary-foreground/60">
                      {CITY_ROMAJI[area.city] ?? area.prefecture}
                    </div>
                  </div>
                  <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-border opacity-0 transition-all group-hover:text-primary-foreground/50 group-hover:opacity-100" />
                </button>
              ))}
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

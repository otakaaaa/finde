import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, Heart, Shirt, ShoppingBag, Baby, Users, Sparkles } from 'lucide-react'
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
  mens: <Shirt className="h-8 w-8" />,
  ladies: <ShoppingBag className="h-8 w-8" />,
  kids: <Baby className="h-8 w-8" />,
  unisex: <Users className="h-8 w-8" />,
  vintage: <Sparkles className="h-8 w-8" />,
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
}

const FeaturedCard = ({ shop }: FeaturedCardProps) => {
  const coverPhoto = shop.photos[0]
  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group bg-white rounded-2xl overflow-hidden editorial-shadow transition-transform hover:-translate-y-2"
    >
      <div className="relative h-72 overflow-hidden">
        {coverPhoto ? (
          <img
            src={getPhotoUrl(coverPhoto.storagePath)}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-5xl">🏪</div>
        )}
        {shop.categories[0] && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
            {shop.categories[0].name}
          </span>
        )}
        <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-transform hover:scale-110">
          <Heart className="h-4 w-4" />
        </div>
      </div>
      <div className="p-8">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-headline text-xl font-bold">{shop.name}</h3>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-amber-500" />
            <span className="text-sm font-bold">
              {shop.averageRating ? shop.averageRating.toFixed(1) : '—'}
            </span>
          </div>
        </div>
        {shop.area && (
          <div className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{shop.area.city}</span>
          </div>
        )}
        {shop.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {shop.description}
          </p>
        )}
      </div>
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

  const featuredShops = popularData?.pages[0]?.items.slice(0, 6) ?? []

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
      {/* Hero */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-primary/95" />
        <div className="relative z-10 max-w-4xl px-6 text-center">
          <h1 className="font-headline mb-8 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            あなたの街の、<br />とっておきの一着へ。
          </h1>
          <div className="editorial-shadow flex flex-col items-center gap-2 rounded-2xl bg-white p-2 md:flex-row">
            <div className="flex flex-1 items-center px-4 w-full">
              <ShopSearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (stats.shopCount > 0 || stats.areaCount > 0) && (
        <section className="border-b bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
              <div className="p-6">
                <div className="font-headline mb-2 text-5xl font-black text-primary">
                  {stats.shopCount.toLocaleString()}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Registered Shops
                </div>
              </div>
              <div className="p-6">
                <div className="font-headline mb-2 text-5xl font-black text-primary">
                  {stats.areaCount}+
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Curated Areas
                </div>
              </div>
              <div className="p-6">
                <div className="font-headline mb-2 text-5xl font-black text-primary">Free</div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Search Experience
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col items-end justify-between gap-4 md:flex-row">
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-primary">
                  Discovery
                </span>
                <h2 className="font-headline text-3xl font-extrabold md:text-4xl">
                  カテゴリで探す
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => goWithCategory(cat.id)}
                  className="group flex flex-col items-center rounded-2xl bg-white p-8 editorial-shadow transition-all hover:bg-primary active:scale-95"
                >
                  <span className="mb-4 text-primary transition-all group-hover:scale-110 group-hover:text-white">
                    {CATEGORY_ICONS[cat.code as CategoryCode] ?? <Shirt className="h-8 w-8" />}
                  </span>
                  <span className="text-sm font-bold group-hover:text-white">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured shops */}
      {featuredShops.length > 0 && (
        <section className="bg-gray-50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 flex items-end justify-between">
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-primary">
                  Highly Rated
                </span>
                <h2 className="font-headline text-3xl font-extrabold md:text-4xl">
                  注目の店舗
                </h2>
              </div>
              <Link
                to="/shops"
                onClick={() => setShopFilters({ sort: 'popular' })}
                className="group flex items-center gap-1 text-sm font-bold text-primary"
              >
                すべて見る
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {featuredShops.map((shop) => (
                <FeaturedCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Areas */}
      {areas && areas.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <span className="mb-3 block text-xs font-bold uppercase tracking-[0.3em] text-primary">
                Location
              </span>
              <h2 className="font-headline text-3xl font-extrabold md:text-4xl">
                エリアで探す
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
              {areas.slice(0, 8).map((area) => (
                <button
                  key={area.id}
                  onClick={() => goWithArea(area.id)}
                  className="group rounded-2xl bg-gray-100 p-6 text-center transition-all hover:bg-white hover:editorial-shadow"
                >
                  <div className="mb-1 text-lg font-bold transition-colors group-hover:text-primary">
                    {CITY_ROMAJI[area.city] ?? area.city}
                  </div>
                  <div className="text-xs text-muted-foreground">{area.prefecture}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {!user && (
        <section className="px-6 py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary">
            <div className="relative z-10 px-12 py-20 text-center md:px-20">
              <h2 className="font-headline mb-6 text-3xl font-extrabold text-white md:text-5xl">
                理想の一着との出会いを、ここから。
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-lg text-white/80">
                会員登録して、お気に入りのショップを保存したり、<br />
                新着アイテムの通知を受け取りましょう。
              </p>
              <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                <Link
                  to="/auth/register"
                  className="w-full rounded-2xl bg-white px-12 py-5 text-lg font-bold text-primary transition-opacity hover:opacity-90 active:scale-95 md:w-auto"
                >
                  無料で始める
                </Link>
                <Link
                  to="/auth/login"
                  className="w-full rounded-2xl border-2 border-white/30 px-12 py-5 text-lg font-bold text-white transition-all hover:bg-white/10 md:w-auto"
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

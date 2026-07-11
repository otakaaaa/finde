import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, ChevronRight, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useShops } from '@/hooks/useShops'
import { useShareTimeline } from '@/hooks/useShareTimeline'
import { useLatestPressReleases } from '@/hooks/usePressReleases'
import { useUiStore } from '@/store/uiStore'
import { SharePostCard } from '@/components/share/SharePostCard'
import { Seo } from '@/components/seo/Seo'
import { getR2Url } from '@/lib/r2'
import type { Category, Shop } from '@/types'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-photos', storagePath)

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

const formatNewsDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** Instagram風の店舗フィードカード */
const ShopFeedCard = ({ shop }: { shop: Shop }) => {
  const photo = shop.photos[0]
  const location = [shop.area?.prefecture, shop.area?.city].filter(Boolean).join(' ')
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background">
      {/* Header */}
      <Link to={`/shops/${shop.id}`} className="flex items-center gap-3 px-4 py-3">
        <img
          src={photo ? getPhotoUrl(photo.storagePath) : '/noimage.png'}
          alt=""
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold leading-tight">{shop.name}</span>
          {location && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
        </span>
      </Link>

      {/* Photo */}
      <Link to={`/shops/${shop.id}`} className="block bg-muted">
        <img
          src={photo ? getPhotoUrl(photo.storagePath) : '/noimage.png'}
          alt={shop.name}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      </Link>

      {/* Body */}
      <div className="px-4 py-3">
        {shop.brands.length > 0 && (
          <p className="mb-1 line-clamp-1 text-xs font-bold text-foreground/70">
            {shop.brands.slice(0, 6).map((b) => `#${b.name}`).join(' ')}
          </p>
        )}
        {shop.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground/80">{shop.description}</p>
        )}
      </div>
    </article>
  )
}

const SectionHeading = ({ title, to, linkLabel }: { title: string; to?: string; linkLabel?: string }) => (
  <div className="mb-3 flex items-center justify-between px-1">
    <h2 className="text-[15px] font-bold">{title}</h2>
    {to && (
      <Link to={to} className="flex items-center text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
        {linkLabel ?? 'すべて見る'}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    )}
  </div>
)

const FeedSkeleton = () => (
  <div className="space-y-4">
    {[0, 1].map((i) => (
      <div key={i} className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="aspect-square w-full animate-pulse bg-muted" />
      </div>
    ))}
  </div>
)

const TopPage = () => {
  const navigate = useNavigate()
  const { setShopFilters } = useUiStore()
  const { data: shopsData } = useShops({ sort: 'newest' })
  const {
    data: timelineData,
    isLoading: timelineLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useShareTimeline('recent')
  const { data: categories } = useCategories()
  const { data: news } = useLatestPressReleases()

  const shops = shopsData?.pages.flatMap((p) => p.items) ?? []
  const posts = timelineData?.pages.flatMap((p) => p.items) ?? []

  const goCategory = (categoryId: number) => {
    setShopFilters({ categoryId })
    navigate('/shops')
  }

  return (
    <div className="mx-auto max-w-[630px] px-0 sm:px-4">
      <Seo title="セレクトショップ・古着屋検索" path="/" />

      {/*
        ストーリーズ風の新着店舗サークルはデザイン再検討のため一旦非表示。
        コンポーネントは @/components/shop/ShopStory に保持している。
      */}

      {/* ── 検索バー + カテゴリチップ ────────────────── */}
      <section className="space-y-3 border-b border-border px-4 py-4">
        <Link
          to="/shops"
          className="flex h-10 items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          店舗・エリア・ブランドで検索
        </Link>
        {categories && categories.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goCategory(c.id)}
                className="h-8 shrink-0 rounded-full bg-muted px-4 text-xs font-bold text-foreground/80 transition-colors hover:bg-border/70"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── フィード: シャレ活 + 店舗 ─────────────────── */}
      <section className="space-y-6 py-5">
        <div className="px-4 sm:px-0">
          <SectionHeading title="シャレ活" to="/share" />
          {timelineLoading ? (
            <FeedSkeleton />
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <SharePostCard key={post.id} post={post} />
              ))}
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mx-auto block rounded-lg px-4 py-2 text-sm font-bold text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {isFetchingNextPage ? '読み込み中…' : 'さらに表示'}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border px-6 py-10 text-center">
              <p className="text-sm font-bold">まだ投稿がありません</p>
              <p className="mt-1 text-xs text-muted-foreground">
                お気に入りコーデやお店での出来事をシェアしてみましょう。
              </p>
              <Link
                to="/share/new"
                className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground"
              >
                シャレ活を投稿する
              </Link>
            </div>
          )}
        </div>

        {/* 店舗フィード */}
        {shops.length > 0 && (
          <div className="px-4 sm:px-0">
            <SectionHeading title="新着店舗" to="/shops" />
            <div className="space-y-4">
              {shops.slice(0, 6).map((shop) => (
                <ShopFeedCard key={shop.id} shop={shop} />
              ))}
            </div>
          </div>
        )}

        {/* お知らせ */}
        {news && news.length > 0 && (
          <div className="px-4 sm:px-0">
            <SectionHeading title="お知らせ" to="/news" />
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {news.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{item.title}</span>
                    {item.publishedAt && (
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {formatNewsDate(item.publishedAt)}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-4 sm:px-0">
          <div className="rounded-xl border border-border px-6 py-8 text-center">
            <p className="text-sm font-bold">知っている名店を、みんなと共有しよう</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              地元の掘り出しもの、行きつけのセレクト。
              あなたの「好き」がFINDEを育てます。
            </p>
            <Link
              to="/listing-request"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground"
            >
              お店を推薦する
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TopPage

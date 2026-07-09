import { Link, useParams } from 'react-router'
import { ChevronLeft, Store } from 'lucide-react'
import { useBrand, useShopsByBrand } from '@/hooks/useBrands'
import { ShopCard } from '@/components/shop/ShopCard'

const ShopGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="overflow-hidden">
        <div className="aspect-[3/4] animate-pulse bg-muted" />
        <div className="border-t border-border bg-background px-3 py-3">
          <div className="h-3 w-2/3 animate-pulse rounded-sm bg-muted" />
          <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded-sm bg-muted" />
        </div>
      </div>
    ))}
  </div>
)

const BrandDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: brand, isLoading: brandLoading, isError: brandError } = useBrand(id ?? '')
  const { data: shops, isLoading: shopsLoading, isError: shopsError } = useShopsByBrand(id ?? '')

  if (brandError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-16">
        {/* SEOメタはルートの meta エクスポート（routes/brand-detail.tsx）が出力する */}
        <div className="border border-border p-12 text-center">
          <p className="text-sm font-bold text-muted-foreground">ブランド情報の読み込みに失敗しました</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* SEOメタはルートの meta エクスポート（routes/brand-detail.tsx）が出力する */}
      {/* ── Header ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span
            className="font-headline font-black leading-none tracking-tighter text-white/[0.04]"
            style={{ fontSize: 'clamp(60px, 12vw, 130px)' }}
          >
            BRAND
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="pb-6">
            <Link
              to="/brands"
              className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 transition-colors hover:text-white/70"
            >
              <ChevronLeft className="h-3 w-3" />
              取扱店舗一覧
            </Link>

            {brandLoading ? (
              <div className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded-sm bg-white/10" />
                <div className="h-9 w-48 animate-pulse rounded-sm bg-white/10" />
              </div>
            ) : (
              <>
                {brand?.nameKana && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.5em] text-white/30">
                    {brand.nameKana}
                  </p>
                )}
                <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                  {brand?.name}
                </h1>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Shop count bar ──────────────────────────── */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-16">
          <div className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-muted-foreground/40" />
            {shopsLoading ? (
              <div className="h-3 w-20 animate-pulse rounded-sm bg-muted" />
            ) : (
              <span className="text-[11px] font-bold text-muted-foreground">
                {shops?.length ?? 0}店舗が取り扱い中
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Shop list ───────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-16 md:py-14">

          {shopsLoading && <ShopGridSkeleton />}

          {shopsError && (
            <p className="text-sm text-red-500">店舗情報の取得に失敗しました</p>
          )}

          {!shopsLoading && !shopsError && (shops?.length ?? 0) === 0 && (
            <div className="py-24 text-center">
              <p
                className="font-headline font-black text-muted-foreground/10"
                style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                0
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                現在このブランドを取り扱っている店舗は登録されていません
              </p>
              <Link
                to="/shops"
                className="mt-6 inline-block text-[11px] font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline"
              >
                全店舗を見る →
              </Link>
            </div>
          )}

          {!shopsLoading && !shopsError && (shops?.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shops!.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default BrandDetailPage

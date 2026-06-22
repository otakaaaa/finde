import { useParams, useNavigate, Link } from 'react-router'
import { ChevronLeft, Package, Plus, Image } from 'lucide-react'
import { useShopItems } from '@/hooks/useShopItems'
import { getR2Url } from '@/lib/r2'

const ShopItemTypesPage = () => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()

  const { data: shopItems, isLoading } = useShopItems(shopId ?? '')

  const totalItems = shopItems?.length ?? 0

  return (
    <div className="min-h-[calc(100dvh-56px)]">

      {/* ── Page header ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-0 pt-10 md:px-16">
        <div className="pointer-events-none absolute bottom-0 right-0 translate-y-1/4 select-none pr-2 md:pr-6">
          <span className="font-headline font-black leading-none tracking-tighter text-white/[0.04]" style={{ fontSize: 'clamp(80px, 14vw, 160px)' }}>
            ITEMS
          </span>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="pb-6">
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
            >
              <ChevronLeft className="h-3 w-3" />
              ダッシュボードへ
            </button>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— Owner</p>
            <div className="flex items-end justify-between">
              <h1 className="font-headline text-3xl font-black leading-none tracking-tight text-white md:text-4xl">
                アイテム管理
              </h1>
              {!isLoading && totalItems > 0 && (
                <span className="mb-1 font-headline text-[11px] font-black tabular-nums text-white/30">
                  {String(totalItems).padStart(2, '0')} 登録
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Description + action ───────────────────── */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-16">
          <p className="text-[11px] text-muted-foreground/60">
            取り扱い商品を登録すると、ウィッシュが一致するユーザーへ自動で通知されます。
          </p>
          <Link
            to={`/owner/shops/${shopId}/items/new`}
            className="ml-4 flex shrink-0 items-center gap-1.5 bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-3 w-3" />
            アイテムを登録
          </Link>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-16 md:py-14">

          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-border bg-white">
                  <div className="aspect-square animate-pulse bg-muted" />
                  <div className="space-y-2 px-3 py-2.5">
                    <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
                    <div className="h-2 w-1/2 animate-pulse rounded-sm bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && totalItems === 0 && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Package className="h-10 w-10 text-muted-foreground/15" />
              <p className="text-sm text-muted-foreground/50">まだアイテムが登録されていません</p>
              <Link
                to={`/owner/shops/${shopId}/items/new`}
                className="flex items-center gap-1.5 bg-primary px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-3 w-3" />
                最初のアイテムを登録
              </Link>
            </div>
          )}

          {/* ── 登録済みアイテム一覧 ───────────────────── */}
          {!isLoading && totalItems > 0 && (
            <div>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-headline text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                  登録済みアイテム
                </span>
                <span className="font-headline text-[9px] font-black tabular-nums text-muted-foreground/25">
                  {String(totalItems).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {shopItems!.map((item) => {
                  const coverPhoto = item.photos[0]
                  return (
                    <div key={item.id} className="group border border-border bg-white editorial-shadow">
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {coverPhoto ? (
                          <img
                            src={getR2Url('shop-items', coverPhoto.storagePath)}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground/20" />
                          </div>
                        )}
                        {!item.isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-sm bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                              非公開
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="font-headline text-[11px] font-black tracking-tight text-foreground/80 line-clamp-1">
                          {item.name}
                        </p>
                        {item.itemType && (
                          <p className="mt-0.5 text-[9px] text-muted-foreground/50">{item.itemType.name}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ShopItemTypesPage

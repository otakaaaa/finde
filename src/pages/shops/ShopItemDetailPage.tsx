import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { ChevronLeft, Store, Tag } from 'lucide-react'
import { useShopItem } from '@/hooks/useShopItems'
import { useShop } from '@/hooks/useShop'
import { useSizes } from '@/hooks/useSizes'
import { useRecordShopItemView } from '@/hooks/useShopEvent'
import { getR2Url } from '@/lib/r2'
import { cn } from '@/lib/utils'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-items', storagePath)

const ShopItemDetailPage = () => {
  const { shopId, itemId } = useParams<{ shopId: string; itemId: string }>()
  const { data: item, isLoading, isError } = useShopItem(itemId ?? '')
  const { data: shop } = useShop(shopId ?? '')
  const { data: sizes } = useSizes()
  const [activePhoto, setActivePhoto] = useState(0)

  // アクセス解析: アイテム閲覧を記録
  useRecordShopItemView(shopId ?? '', itemId ?? '')

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !item) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-16">
          <p className="font-headline font-black text-muted-foreground" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', lineHeight: 1, letterSpacing: '-0.04em' }}>
            NOT FOUND
          </p>
          <p className="mt-4 text-sm text-muted-foreground">アイテムが見つかりませんでした</p>
          <Link to={shopId ? `/shops/${shopId}` : '/shops'} className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.3em] text-primary underline-offset-2 hover:underline">
            ← 店舗ページへ
          </Link>
        </div>
      </div>
    )
  }

  const sizeLabels = item.sizeIds
    .map((id) => sizes?.all.find((s) => s.id === id)?.label)
    .filter((l): l is string => !!l)

  return (
    <div className="bg-background">
      {/* ── Header ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary px-6 pb-8 pt-10 md:px-16">
        <div className="relative mx-auto max-w-4xl">
          <Link
            to={`/shops/${shopId}`}
            className="mb-3 flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-3 w-3" />
            {shop?.name ?? '店舗ページ'}へ
          </Link>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">— ITEM</p>
          <h1 className="font-headline text-2xl font-black leading-tight tracking-tight text-white md:text-3xl">
            {item.name}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-16 md:py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">

          {/* ── Photos ──────────────────────────────── */}
          <div>
            {item.photos.length > 0 ? (
              <div className="space-y-3">
                <div className="aspect-square w-full overflow-hidden border border-border bg-white">
                  <img
                    src={getPhotoUrl(item.photos[activePhoto].storagePath)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.photos.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {item.photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setActivePhoto(idx)}
                        className={cn(
                          'h-16 w-16 shrink-0 overflow-hidden border transition-all',
                          idx === activePhoto ? 'border-primary' : 'border-border opacity-60 hover:opacity-100',
                        )}
                      >
                        <img src={getPhotoUrl(photo.storagePath)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center border border-dashed border-border bg-muted/30">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">No Image</span>
              </div>
            )}
          </div>

          {/* ── Detail ──────────────────────────────── */}
          <div className="space-y-6">
            {item.price != null && (
              <p className="font-headline text-3xl font-black tracking-tight text-foreground">
                ¥{item.price.toLocaleString()}
              </p>
            )}

            <dl className="space-y-4 border-t border-border pt-6">
              {item.brand && (
                <Detail label="ブランド" value={item.brand.name} />
              )}
              {item.itemType && (
                <Detail label="アイテムタイプ" value={item.itemType.name} />
              )}
              {sizeLabels.length > 0 && (
                <Detail label="サイズ" value={sizeLabels.join(' / ')} />
              )}
              {item.materials.length > 0 && (
                <Detail
                  label="素材"
                  value={item.materials
                    .map((m) => (m.percentage != null ? `${m.name} ${m.percentage}%` : m.name))
                    .join(' / ')}
                />
              )}
              {!item.isAvailable && (
                <Detail label="状態" value="現在取扱なし" />
              )}
            </dl>

            {item.description && (
              <div className="border-t border-border pt-6">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">説明</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{item.description}</p>
              </div>
            )}

            {/* ── Shop link ──────────────────────────── */}
            <Link
              to={`/shops/${shopId}`}
              className="flex items-center gap-3 border border-border bg-white px-4 py-3.5 transition-colors hover:bg-muted/30"
            >
              <Store className="h-4 w-4 text-muted-foreground/50" />
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">取扱店舗</p>
                <p className="font-headline text-sm font-black tracking-tight text-foreground">{shop?.name ?? '店舗を見る'}</p>
              </div>
              <Tag className="h-3.5 w-3.5 text-muted-foreground/30" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-4">
    <dt className="w-20 shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{label}</dt>
    <dd className="text-sm font-semibold text-foreground">{value}</dd>
  </div>
)

export default ShopItemDetailPage

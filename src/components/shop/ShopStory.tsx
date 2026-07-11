import { Link } from 'react-router'
import { Store } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import type { Shop } from '@/types'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-photos', storagePath)

/**
 * ストーリーズ風の新着店舗サークル。
 * 現在トップページでは非表示（デザイン再検討中）。使用する場合:
 *   <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
 *     {shops.map((shop) => <ShopStory key={shop.id} shop={shop} />)}
 *   </div>
 */
export const ShopStory = ({ shop }: { shop: Shop }) => {
  const photo = shop.photos[0]
  return (
    <Link to={`/shops/${shop.id}`} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
      <span className="ig-story-ring rounded-full p-[2.5px]">
        <span className="block rounded-full bg-background p-[2px]">
          {photo ? (
            <img
              src={getPhotoUrl(photo.storagePath)}
              alt={shop.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </span>
          )}
        </span>
      </span>
      <span className="w-full truncate text-center text-[11px] leading-tight text-foreground/80">
        {shop.name}
      </span>
    </Link>
  )
}

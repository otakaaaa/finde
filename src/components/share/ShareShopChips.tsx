import { Link } from 'react-router'
import { Store } from 'lucide-react'
import { getShopCoverUrl } from '@/components/share/sharePhoto'
import type { SharePostShop } from '@/types'

interface ShareShopChipsProps {
  shops: SharePostShop[]
}

export const ShareShopChips = ({ shops }: ShareShopChipsProps) => {
  if (shops.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {shops.map((shop) => (
        <Link
          key={shop.id}
          to={`/shops/${shop.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-white py-1 pl-1 pr-2.5 text-[10px] font-bold text-foreground/70 transition-colors hover:border-primary/40 hover:text-primary"
        >
          {shop.coverPhotoPath ? (
            <img
              src={getShopCoverUrl(shop.coverPhotoPath)}
              alt=""
              className="h-4 w-4 rounded-[2px] object-cover"
              loading="lazy"
            />
          ) : (
            <Store className="h-3 w-3 text-muted-foreground/40" />
          )}
          {shop.name}
        </Link>
      ))}
    </div>
  )
}

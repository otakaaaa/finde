import { Link } from 'react-router'
import { Shirt } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import type { MatchItem } from '@/types'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-items', storagePath)

interface MatchedItemCardProps {
  item: MatchItem
}

export const MatchedItemCard = ({ item }: MatchedItemCardProps) => {
  return (
    <Link
      to={`/shops/${item.shopId}/items/${item.id}`}
      className="group flex items-center gap-3 border border-border bg-white p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
    >
      {/* Photo */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-muted">
        {item.coverPhotoPath ? (
          <img
            src={getPhotoUrl(item.coverPhotoPath)}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-5 w-5 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-headline text-[13px] font-black leading-snug tracking-tight text-foreground group-hover:text-primary">
          {item.name}
        </p>

        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          {item.brandName && <span className="truncate font-semibold">{item.brandName}</span>}
          {item.brandName && <span className="text-muted-foreground/30">·</span>}
          <span className="truncate">{item.shopName}</span>
        </div>

        {item.price != null && (
          <p className="mt-1 font-headline text-[13px] font-black tabular-nums tracking-tight text-foreground">
            ¥{item.price.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  )
}

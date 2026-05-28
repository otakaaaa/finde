import { Link } from 'react-router'
import { MapPin, Star, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatchedShop } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=120&height=120&resize=cover`

interface MatchedShopCardProps {
  matched: MatchedShop
}

export const MatchedShopCard = ({ matched }: MatchedShopCardProps) => {
  const { shop, hasBrandMatch } = matched

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group flex items-center gap-3 border border-border bg-white p-2.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
    >
      {/* Photo */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-muted">
        {shop.coverPhotoPath ? (
          <img
            src={getPhotoUrl(shop.coverPhotoPath)}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Store className="h-5 w-5 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate font-headline text-[13px] font-black leading-snug tracking-tight text-foreground group-hover:text-primary">
            {shop.name}
          </p>
          {shop.averageRating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-amber-500">
              <Star className="h-2.5 w-2.5 fill-amber-500" />
              <span className="text-[10px] font-bold tabular-nums">{shop.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {shop.area && (
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{shop.area.city}</span>
          </div>
        )}

        {hasBrandMatch && (
          <span className={cn(
            'mt-1 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5',
            'bg-primary/[0.07] text-[9px] font-black uppercase tracking-[0.15em] text-primary',
          )}>
            ブランド一致
          </span>
        )}
      </div>
    </Link>
  )
}

import { Link } from 'react-router'
import { MapPin, Star, ArrowUpRight } from 'lucide-react'
import type { Shop } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=400&height=533&resize=cover`

interface ShopCardProps {
  shop: Shop
}

export const ShopCard = ({ shop }: ShopCardProps) => {
  const coverPhoto = shop.photos[0]

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group relative block overflow-hidden bg-muted"
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden">
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
        <div className="absolute inset-0 bg-primary/0 transition-all duration-500 group-hover:bg-primary/40" />
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/0 opacity-0 transition-all duration-300 group-hover:bg-white group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      {/* Category tag */}
      {shop.categories[0] && (
        <div className="absolute left-3 top-3">
          <span className="rounded-sm bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
            {shop.categories[0].name}
          </span>
        </div>
      )}

      {/* Info bar */}
      <div className="border-t border-border bg-background px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-headline text-sm font-bold leading-snug">{shop.name}</h3>
            {shop.area && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{shop.area.city}</span>
              </div>
            )}
          </div>
          {shop.averageRating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-amber-500">
              <Star className="h-3 w-3 fill-amber-500" />
              <span className="text-[10px] font-bold tabular-nums">{shop.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

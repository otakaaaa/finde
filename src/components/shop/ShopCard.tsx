import { Link } from 'react-router'
import { Star, Heart, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types'

interface ShopCardProps {
  shop: Shop
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=400&height=300&resize=cover`

export const ShopCard = ({ shop }: ShopCardProps) => {
  const coverPhoto = shop.photos[0]
  const rating = shop.averageRating

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {coverPhoto ? (
          <img
            src={getPhotoUrl(coverPhoto.storagePath)}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-4xl">🏪</span>
          </div>
        )}
        {/* Categories */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {shop.categories.slice(0, 2).map((cat) => (
            <span
              key={cat.id}
              className="rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
            >
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate font-semibold leading-snug">{shop.name}</h3>

        {shop.area && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{shop.area.city}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star
              className={cn(
                'h-3.5 w-3.5',
                rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              )}
            />
            <span className="text-xs font-medium">
              {rating ? rating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-muted-foreground">
              ({shop.reviewCount})
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3.5 w-3.5" />
            <span>{shop.favoriteCount}</span>
          </div>
        </div>

        {shop.priceRange && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {shop.priceRange.label}
          </p>
        )}
      </div>
    </Link>
  )
}

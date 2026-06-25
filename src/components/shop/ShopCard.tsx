import { Link } from 'react-router'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shop } from '@/types'
import { useShopMasterData } from '@/hooks/useShopMasterData'

import { getR2Url } from '@/lib/r2'

const getPhotoUrl = (storagePath: string) => getR2Url('shop-photos', storagePath)

interface ShopCardProps {
  shop: Shop
  featured?: boolean
}

export const ShopCard = ({ shop, featured = false }: ShopCardProps) => {
  const coverPhoto = shop.photos[0]
  const { data: master } = useShopMasterData()
  const cityName =
    master?.cities.find((c) => c.id === shop.cityId)?.name ?? shop.area?.city ?? null

  return (
    <Link
      to={`/shops/${shop.id}`}
      className="group relative block overflow-hidden bg-muted"
    >
      {/* Photo */}
      <div className={cn('relative overflow-hidden', featured ? 'aspect-video' : 'aspect-[3/4]')}>
        {coverPhoto ? (
          <img
            src={getPhotoUrl(coverPhoto.storagePath)}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <img
            src="/noimage.png"
            alt={shop.name}
            className="h-full w-full object-cover"
          />
        )}

        {/* Dark overlay — fades in on hover */}
        <div className="absolute inset-0 bg-primary/0 transition-all duration-500 group-hover:bg-primary/80" />

        {/* Hover: shop name centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <div className="translate-y-3 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="font-headline text-base font-black leading-tight text-white">{shop.name}</p>
            {cityName && (
              <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-white/60">
                <MapPin className="h-2.5 w-2.5" />
                {cityName}
              </p>
            )}
          </div>
        </div>

        {/* ArrowUpRight — top-right, appears on hover */}
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center bg-white/0 opacity-0 transition-all duration-300 group-hover:bg-white group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>

      {/* Category tag */}
      {shop.categories[0] && (
        <div className="absolute left-3 top-3">
          <span className="bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground">
            {shop.categories[0].name}
          </span>
        </div>
      )}

      {/* Info bar */}
      <div className="border-t border-border bg-background px-3 py-3">
        <div className="min-w-0">
          <div>
            <h3 className="truncate font-headline text-sm font-bold leading-snug">{shop.name}</h3>
          </div>
          {cityName && (
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{cityName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

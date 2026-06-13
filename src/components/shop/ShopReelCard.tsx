import { useState } from 'react'
import { Link } from 'react-router'
import { MapPin, Star, ArrowUpRight, Store } from 'lucide-react'
import { ShopReelFavoriteButton } from './ShopReelFavoriteButton'
import type { Shop } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=800&height=1200&resize=cover`

const MAX_VISIBLE_BRANDS = 8

interface ShopReelCardProps {
  shop: Shop
  index: number
  total: number
}

export const ShopReelCard = ({ shop, index, total }: ShopReelCardProps) => {
  const [photoIndex, setPhotoIndex] = useState(0)

  const photos = shop.photos
  const currentPhoto = photos[photoIndex]

  const handlePhotoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (photos.length <= 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 2) {
      setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    } else {
      setPhotoIndex((prev) => (prev + 1) % photos.length)
    }
  }

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ height: '100svh' }}>
      {/* Photo background */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handlePhotoTap}
        aria-label="タップで写真を切り替え"
      >
        {currentPhoto ? (
          <img
            src={getPhotoUrl(currentPhoto.storagePath)}
            alt={shop.name}
            className="h-full w-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Store className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      {/* Photo progress dots */}
      {photos.length > 1 && (
        <div className="pointer-events-none absolute right-4 top-16 flex flex-col gap-1">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-6 w-0.5 rounded-full transition-all ${
                i === photoIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-20">
        {/* Category tag */}
        {shop.categories[0] && (
          <span className="mb-3 inline-block bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
            {shop.categories[0].name}
          </span>
        )}

        {/* Shop name */}
        <h2 className="font-headline text-3xl font-black leading-tight text-white drop-shadow-lg">
          {shop.name}
        </h2>

        {/* Area + rating */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {shop.area && (
            <div className="flex items-center gap-1 text-white/70">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-xs">
                {shop.area.prefecture} {shop.area.city}
              </span>
            </div>
          )}
          {shop.averageRating != null && (
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-3 w-3 fill-amber-400 shrink-0" />
              <span className="text-xs font-bold tabular-nums">
                {shop.averageRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-white/40">({shop.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Description */}
        {shop.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/60">
            {shop.description}
          </p>
        )}

        {/* Brands */}
        {shop.brands.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {shop.brands.slice(0, MAX_VISIBLE_BRANDS).map((brand) => (
              <span
                key={brand.id}
                className="shrink-0 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white/60"
              >
                {brand.name}
              </span>
            ))}
            {shop.brands.length > MAX_VISIBLE_BRANDS && (
              <span className="shrink-0 border border-white/10 px-2 py-0.5 text-[10px] text-white/30">
                +{shop.brands.length - MAX_VISIBLE_BRANDS}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <ShopReelFavoriteButton shopId={shop.id} />
          <Link
            to={`/shops/${shop.id}`}
            className="flex items-center gap-2 border border-white/30 bg-white px-4 py-2.5 text-sm font-bold text-primary transition-opacity hover:opacity-90"
          >
            詳細を見る
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Counter */}
        <div className="mt-4 text-[10px] tabular-nums text-white/25">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router'
import { Heart, MapPin, Star } from 'lucide-react'
import { useFavoriteShops } from '@/hooks/useFavorites'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/shop-photos/${storagePath}?width=200&height=150&resize=cover`

const FavoritesPage = () => {
  const { data: favorites, isLoading, isError } = useFavoriteShops()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">お気に入り</h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          お気に入りの読み込みに失敗しました
        </div>
      )}

      {!isLoading && !isError && favorites?.length === 0 && (
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">お気に入りがまだありません</p>
          <Link
            to="/shops"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            店舗を探す
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {favorites?.map(({ shops }) => {
          const photo = shops.shop_photos[0]
          return (
            <Link
              key={shops.id}
              to={`/shops/${shops.id}`}
              className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {photo ? (
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={shops.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🏪</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="truncate font-semibold">{shops.name}</h3>
                {shops.areas && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{shops.areas.city}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">
                    {shops.average_rating ? shops.average_rating.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">({shops.review_count})</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default FavoritesPage

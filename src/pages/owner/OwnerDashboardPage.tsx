import { Link } from 'react-router'
import { Edit, BarChart2, Star, Heart } from 'lucide-react'
import { useOwnerShops } from '@/hooks/useOwnerShops'

const OwnerDashboardPage = () => {
  const { data: shops, isLoading, isError } = useOwnerShops()

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">店舗管理</h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          店舗情報の読み込みに失敗しました
        </div>
      )}

      {!isLoading && !isError && shops?.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>管理している店舗がありません</p>
          <Link
            to="/listing-request"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            店舗の掲載申請をする
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {shops?.map((shop) => (
          <div key={shop.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold truncate">{shop.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    shop.status === 'public'
                      ? 'bg-green-50 text-green-700'
                      : shop.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {shop.status === 'public' ? '公開中' : shop.status === 'pending' ? '審査中' : '非公開'}
                  </span>
                </div>

                {shop.area && (
                  <p className="text-sm text-muted-foreground">{shop.area.city}</p>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{shop.averageRating ? shop.averageRating.toFixed(1) : '—'}</span>
                    <span className="text-muted-foreground">({shop.reviewCount}件)</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{shop.favoriteCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/shops/${shop.id}`}
                  className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <BarChart2 className="h-4 w-4" />
                  詳細
                </Link>
                <Link
                  to={`/owner/shops/${shop.id}`}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4" />
                  編集
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OwnerDashboardPage

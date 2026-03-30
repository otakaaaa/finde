import { useCallback } from 'react'
import { useShops } from '@/hooks/useShops'
import { useUiStore } from '@/store/uiStore'
import { ShopCard } from '@/components/shop/ShopCard'
import { ShopFiltersPanel } from '@/components/shop/ShopFilters'
import { Button } from '@/components/ui/button'
import type { ShopFilters } from '@/types'

const ShopsPage = () => {
  const { shopFilters, setShopFilters } = useUiStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useShops(shopFilters)

  const shops = data?.pages.flatMap((p) => p.items) ?? []

  const handleFiltersChange = useCallback(
    (filters: ShopFilters) => setShopFilters(filters),
    [setShopFilters]
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">店舗を探す</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          全国の古着屋・セレクトショップを検索できます
        </p>
      </div>

      <div className="mb-6">
        <ShopFiltersPanel filters={shopFilters} onChange={handleFiltersChange} />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          店舗の読み込みに失敗しました。再度お試しください。
        </div>
      )}

      {!isLoading && !isError && shops.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          条件に合う店舗が見つかりませんでした
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '読み込み中...' : 'もっと見る'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ShopsPage

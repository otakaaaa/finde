import { useSearchParams } from 'react-router'
import { useShopSearch } from '@/hooks/useShopSearch'
import { ShopCard } from '@/components/shop/ShopCard'
import { ShopSearchBar } from '@/components/shop/ShopSearchBar'

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const { data: shops, isLoading, isError } = useShopSearch(query)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <ShopSearchBar initialQuery={query} />
      </div>

      {query.trim().length < 2 && (
        <p className="text-center text-sm text-muted-foreground py-16">
          2文字以上入力して検索してください
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          検索に失敗しました。再度お試しください。
        </div>
      )}

      {!isLoading && !isError && query.trim().length >= 2 && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            「{query}」の検索結果: {shops?.length ?? 0}件
          </p>

          {shops?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              検索結果が見つかりませんでした
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shops?.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage

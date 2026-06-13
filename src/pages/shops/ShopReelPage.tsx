import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { useShops } from '@/hooks/useShops'
import { useUiStore } from '@/store/uiStore'
import { ToastStack } from '@/components/ui/Toast'
import { ShopReelCard } from '@/components/shop/ShopReelCard'

const ShopReelPage = () => {
  const navigate = useNavigate()
  const { shopFilters } = useUiStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useShops(shopFilters)

  const shops = data?.pages.flatMap((p) => p.items) ?? []
  const lastCardRef = useRef<HTMLDivElement>(null)

  // Observe last card to trigger infinite load
  useEffect(() => {
    const el = lastCardRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shops.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="relative bg-black" style={{ height: '100svh' }}>
      {/* Fixed top bar */}
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 pt-4">
        <button
          onClick={() => navigate('/shops')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="店舗一覧に戻る"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => navigate('/shops')}
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          aria-label="グリッド表示に切り替え"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      {/* Scroll container */}
      <div
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center" style={{ height: '100svh' }}>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && shops.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 text-white" style={{ height: '100svh' }}>
            <p className="font-headline text-2xl font-black">店舗が見つかりません</p>
            <button
              onClick={() => navigate('/shops')}
              className="text-sm text-white/50 underline underline-offset-2"
            >
              一覧に戻る
            </button>
          </div>
        )}

        {/* Shop cards */}
        {shops.map((shop, i) => (
          <div
            key={shop.id}
            ref={i === shops.length - 1 ? lastCardRef : null}
            style={{ scrollSnapAlign: 'start', height: '100svh' }}
          >
            <ShopReelCard shop={shop} index={i} total={shops.length} />
          </div>
        ))}

        {/* Loading more */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center" style={{ height: '100svh', scrollSnapAlign: 'start' }}>
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/50 border-t-transparent" />
          </div>
        )}
      </div>

      <ToastStack />
    </div>
  )
}

export default ShopReelPage

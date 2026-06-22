import { useState, useEffect, useCallback } from 'react'
import { getR2Url } from '@/lib/r2'
import { usePublicShopBanners, SHOP_BANNER_BUCKET } from '@/hooks/useShopBanners'
import { isBannerLive } from '@/lib/shopBanner'
import { cn } from '@/lib/utils'
import type { ShopBanner } from '@/types'

const AUTO_ADVANCE_MS = 5000

const getBannerUrl = (imagePath: string) => getR2Url(SHOP_BANNER_BUCKET, imagePath)

interface BannerSlideProps {
  banner: ShopBanner
}

const BannerSlide = ({ banner }: BannerSlideProps) => {
  const img = (
    <img
      src={getBannerUrl(banner.imagePath)}
      alt=""
      className="h-full w-full object-cover"
    />
  )
  if (!banner.linkUrl) {
    return <div className="h-full w-full">{img}</div>
  }
  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full w-full"
    >
      {img}
    </a>
  )
}

interface ShopBannerCarouselProps {
  shopId: string
}

export const ShopBannerCarousel = ({ shopId }: ShopBannerCarouselProps) => {
  const { data: allBanners = [] } = usePublicShopBanners(shopId)
  const banners = allBanners.filter((b) => isBannerLive(b))
  const [index, setIndex] = useState(0)

  const count = banners.length

  const goTo = useCallback((i: number) => {
    setIndex((i + count) % count)
  }, [count])

  // index がバナー数を超えないよう補正
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0)
  }, [count, index])

  // 自動送り（複数枚のときのみ）
  useEffect(() => {
    if (count <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [count])

  if (count === 0) return null

  return (
    <div className="relative w-full overflow-hidden bg-muted">
      <div className="relative aspect-[16/5] w-full md:aspect-[1200/250]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-500',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <BannerSlide banner={banner} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`バナー ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

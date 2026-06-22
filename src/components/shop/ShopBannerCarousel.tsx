import { usePublicShopBanners } from '@/hooks/useShopBanners'
import { isBannerLive, hasBannerPlacement } from '@/lib/shopBanner'
import { BannerCarousel } from '@/components/shop/BannerCarousel'
import type { BannerPlacement } from '@/types'

interface ShopBannerCarouselProps {
  shopId: string
  placement: BannerPlacement
  className?: string
}

// 店舗詳細ページのバナー。指定した表示位置（placement）を含む掲載中バナーのみ表示。
export const ShopBannerCarousel = ({ shopId, placement, className }: ShopBannerCarouselProps) => {
  const { data: allBanners = [] } = usePublicShopBanners(shopId)
  const banners = allBanners.filter(
    (b) => isBannerLive(b) && hasBannerPlacement(b, placement),
  )
  return <BannerCarousel banners={banners} className={className} />
}

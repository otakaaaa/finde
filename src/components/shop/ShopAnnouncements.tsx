import { ArrowUpRight } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import { usePublicShopAnnouncements, SHOP_ANNOUNCEMENT_BUCKET } from '@/hooks/useShopAnnouncements'
import { isAnnouncementLive, formatAnnouncementDate } from '@/lib/shopAnnouncement'
import { cn } from '@/lib/utils'
import type { ShopAnnouncement } from '@/types'

const getImageUrl = (imagePath: string) => getR2Url(SHOP_ANNOUNCEMENT_BUCKET, imagePath)

interface AnnouncementItemProps {
  announcement: ShopAnnouncement
}

const AnnouncementItem = ({ announcement }: AnnouncementItemProps) => {
  const content = (
    <>
      {announcement.imagePath && (
        <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-32">
          <img
            src={getImageUrl(announcement.imagePath)}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          {formatAnnouncementDate(announcement)}
        </p>
        <h3 className="mt-1 font-headline text-base font-black leading-snug text-foreground">
          {announcement.title}
        </h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-[1.9] text-foreground/80">
          {announcement.body}
        </p>
        {announcement.linkUrl && (
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary/80 transition-colors group-hover:text-primary">
            詳しく見る
            <ArrowUpRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </>
  )

  if (announcement.linkUrl) {
    return (
      <a
        href={announcement.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 py-5 transition-opacity hover:opacity-80"
      >
        {content}
      </a>
    )
  }
  return <div className="flex gap-4 py-5">{content}</div>
}

interface ShopAnnouncementsProps {
  shopId: string
  className?: string
}

// 店舗詳細ページの「お知らせ」セクション。掲載中のお知らせのみ表示し、0件なら何も描画しない。
export const ShopAnnouncements = ({ shopId, className }: ShopAnnouncementsProps) => {
  const { data: all = [] } = usePublicShopAnnouncements(shopId)
  const announcements = all.filter((a) => isAnnouncementLive(a))

  if (announcements.length === 0) return null

  return (
    <section className={cn(className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">— お知らせ</p>
      <div className="mt-3 divide-y divide-border">
        {announcements.map((announcement) => (
          <AnnouncementItem key={announcement.id} announcement={announcement} />
        ))}
      </div>
    </section>
  )
}

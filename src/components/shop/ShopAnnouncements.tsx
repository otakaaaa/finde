import { useState, useEffect } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { getR2Url } from '@/lib/r2'
import { usePublicShopAnnouncements, SHOP_ANNOUNCEMENT_BUCKET } from '@/hooks/useShopAnnouncements'
import { isAnnouncementLive, formatAnnouncementDate } from '@/lib/shopAnnouncement'
import { cn } from '@/lib/utils'
import { safeExternalHref } from '@/lib/url'
import type { ShopAnnouncement } from '@/types'

const getImageUrl = (imagePath: string) => getR2Url(SHOP_ANNOUNCEMENT_BUCKET, imagePath)

// ── 一覧の行（押下で詳細モーダルを開く） ────────────────────────

interface AnnouncementItemProps {
  announcement: ShopAnnouncement
  onSelect: (announcement: ShopAnnouncement) => void
}

const AnnouncementItem = ({ announcement, onSelect }: AnnouncementItemProps) => (
  <button
    type="button"
    onClick={() => onSelect(announcement)}
    className="group flex w-full items-start gap-4 py-5 text-left transition-opacity hover:opacity-80"
  >
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
      <h3 className="mt-1 line-clamp-1 font-headline text-base font-black leading-snug text-foreground">
        {announcement.title}
      </h3>
      {/* 一覧では本文を2行までに固定し、行の高さを揃える */}
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground/70">
        {announcement.body}
      </p>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary/80 transition-colors group-hover:text-primary">
        詳しく見る
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </div>
  </button>
)

// ── 詳細モーダル ────────────────────────────────────────────────

interface AnnouncementModalProps {
  announcement: ShopAnnouncement
  onClose: () => void
}

const AnnouncementModal = ({ announcement, onClose }: AnnouncementModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[100] flex items-center justify-center bg-foreground/65 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="modal-enter relative flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden bg-white editorial-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-[3px] w-full shrink-0 bg-foreground" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/40 text-white transition-colors hover:bg-foreground/70"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto">
          {announcement.imagePath && (
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              <img
                src={getImageUrl(announcement.imagePath)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="px-6 pb-6 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
              {formatAnnouncementDate(announcement)}
            </p>
            <h2 className="mt-1.5 font-headline text-xl font-black leading-tight tracking-tight text-foreground">
              {announcement.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-[1.9] text-foreground/80">
              {announcement.body}
            </p>

            {safeExternalHref(announcement.linkUrl) && (
              <a
                href={safeExternalHref(announcement.linkUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-foreground px-5 py-2.5 font-headline text-[10px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-75"
              >
                詳しく見る
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── セクション ──────────────────────────────────────────────────

interface ShopAnnouncementsProps {
  shopId: string
  className?: string
}

// 店舗詳細ページの「お知らせ」セクション。掲載中のお知らせのみ表示し、0件なら何も描画しない。
export const ShopAnnouncements = ({ shopId, className }: ShopAnnouncementsProps) => {
  const { data: all = [] } = usePublicShopAnnouncements(shopId)
  const announcements = all.filter((a) => isAnnouncementLive(a))
  const [selected, setSelected] = useState<ShopAnnouncement | null>(null)

  if (announcements.length === 0) return null

  return (
    <section className={cn(className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">— お知らせ</p>
      <div className="mt-3 divide-y divide-border">
        {announcements.map((announcement) => (
          <AnnouncementItem key={announcement.id} announcement={announcement} onSelect={setSelected} />
        ))}
      </div>

      {selected && (
        <AnnouncementModal announcement={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}

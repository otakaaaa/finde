import { cn } from '@/lib/utils'

interface SharePhotoGalleryProps {
  /** 表示する画像URL（storage 解決済み or ローカル object URL）。1〜5枚想定。 */
  urls: string[]
}

/** 投稿詳細・プレビュー用の画像表示（1〜5枚）。 */
export const SharePhotoGallery = ({ urls }: SharePhotoGalleryProps) => {
  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <img src={urls[0]} alt="" className="w-full rounded-sm border border-border object-cover" />
    )
  }

  return (
    <div className={cn('grid gap-1.5', urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
      {urls.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className="aspect-square w-full rounded-sm border border-border object-cover"
          loading="lazy"
        />
      ))}
    </div>
  )
}

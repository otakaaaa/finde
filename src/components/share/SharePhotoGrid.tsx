import { cn } from '@/lib/utils'

interface SharePhotoGridProps {
  urls: string[]
  onImageClick: (index: number) => void
  className?: string
}

const GRID_H = 'h-[300px] sm:h-[340px]'
const IMG_CLS = 'h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90'

const stopAndClick = (e: React.MouseEvent, cb: () => void) => {
  e.preventDefault()
  e.stopPropagation()
  cb()
}

export const SharePhotoGrid = ({ urls, onImageClick, className }: SharePhotoGridProps) => {
  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <img
          src={urls[0]}
          alt=""
          className="max-h-[80vh] w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
          onClick={(e) => stopAndClick(e, () => onImageClick(0))}
          loading="lazy"
        />
      </div>
    )
  }

  if (urls.length === 2) {
    return (
      <div className={cn('flex gap-0.5', GRID_H, className)}>
        {urls.map((url, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            <img
              src={url}
              alt=""
              className={IMG_CLS}
              onClick={(e) => stopAndClick(e, () => onImageClick(i))}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    )
  }

  if (urls.length === 3) {
    return (
      <div className={cn('flex gap-0.5', GRID_H, className)}>
        <div className="w-2/3 overflow-hidden">
          <img
            src={urls[0]}
            alt=""
            className={IMG_CLS}
            onClick={(e) => stopAndClick(e, () => onImageClick(0))}
            loading="lazy"
          />
        </div>
        <div className="flex w-1/3 flex-col gap-0.5">
          {urls.slice(1).map((url, i) => (
            <div key={i} className="flex-1 overflow-hidden">
              <img
                src={url}
                alt=""
                className={IMG_CLS}
                onClick={(e) => stopAndClick(e, () => onImageClick(i + 1))}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 4 images: 2×2
  return (
    <div className={cn('grid grid-cols-2 gap-0.5', GRID_H, className)}>
      {urls.map((url, i) => (
        <div key={i} className="overflow-hidden">
          <img
            src={url}
            alt=""
            className={IMG_CLS}
            onClick={(e) => stopAndClick(e, () => onImageClick(i))}
            loading={i === 0 ? undefined : 'lazy'}
          />
        </div>
      ))}
    </div>
  )
}

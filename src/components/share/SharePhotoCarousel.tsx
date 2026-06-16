import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SharePhotoCarouselProps {
  urls: string[]
}

/**
 * 写真スライドカルーセル（CSS scroll-snap ベース、ライブラリ不要）。
 * 1枚のときはシンプル表示。2枚以上でスライド + ドットインジケーター。
 */
export const SharePhotoCarousel = ({ urls }: SharePhotoCarouselProps) => {
  const [current, setCurrent] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollTo = (index: number) => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || el.clientWidth === 0) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setCurrent(Math.max(0, Math.min(index, urls.length - 1)))
  }, [urls.length])

  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt=""
        className="w-full object-cover"
        style={{ maxHeight: '80vh' }}
      />
    )
  }

  return (
    <div className="relative select-none">
      {/* Scroll container — basis-full ensures each slide = container width */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-scroll"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {urls.map((url, i) => (
          <div key={i} className="basis-full shrink-0 snap-start">
            <img
              src={url}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '80vh' }}
              loading={i === 0 ? undefined : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators — pill 背景で視認性を確保 */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`${i + 1}枚目`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-200',
              i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/85',
            )}
          />
        ))}
      </div>

      {/* Counter badge */}
      <div className="absolute right-3 top-3 rounded-sm bg-black/40 px-2 py-0.5 backdrop-blur-sm">
        <span className="font-headline text-[10px] font-black tabular-nums text-white">
          {current + 1} / {urls.length}
        </span>
      </div>
    </div>
  )
}

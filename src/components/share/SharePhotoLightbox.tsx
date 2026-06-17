import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface SharePhotoLightboxProps {
  urls: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export const SharePhotoLightbox = ({ urls, currentIndex, onClose, onNavigate }: SharePhotoLightboxProps) => {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < urls.length - 1

  const prev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1)
  }, [hasPrev, currentIndex, onNavigate])

  const next = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1)
  }, [hasNext, currentIndex, onNavigate])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, prev, next])

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:text-white"
        aria-label="閉じる"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {urls.length > 1 && (
        <span className="absolute left-1/2 top-4 -translate-x-1/2 text-[11px] font-black tabular-nums text-white/60">
          {currentIndex + 1} / {urls.length}
        </span>
      )}

      {/* Image */}
      <img
        src={urls[currentIndex]}
        alt=""
        className="max-h-[90vh] max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); prev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
          aria-label="前の画像"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); next() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
          aria-label="次の画像"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}
    </div>,
    document.body,
  )
}

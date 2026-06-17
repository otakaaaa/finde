import { useState } from 'react'
import { SharePhotoGrid } from '@/components/share/SharePhotoGrid'
import { SharePhotoLightbox } from '@/components/share/SharePhotoLightbox'

interface SharePhotoGalleryProps {
  urls: string[]
  className?: string
}

export const SharePhotoGallery = ({ urls, className }: SharePhotoGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (urls.length === 0) return null

  return (
    <>
      <SharePhotoGrid
        urls={urls}
        onImageClick={setLightboxIndex}
        className={className}
      />
      {lightboxIndex !== null && (
        <SharePhotoLightbox
          urls={urls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}

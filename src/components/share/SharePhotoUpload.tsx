import { useEffect, useState } from 'react'
import { X, ImagePlus } from 'lucide-react'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { getSharePhotoUrl, SHARE_PHOTO_MAX_BYTES, SHARE_PHOTO_MAX_COUNT } from '@/components/share/sharePhoto'
import { cn } from '@/lib/utils'
import type { SharePhoto } from '@/types'

export interface SharePhotoSelection {
  keepPhotoIds: string[]
  newFiles: File[]
}

interface SharePhotoUploadProps {
  existingPhotos?: SharePhoto[]
  onChange: (selection: SharePhotoSelection) => void
}

const MAX_MB = Math.round(SHARE_PHOTO_MAX_BYTES / (1024 * 1024))

export const SharePhotoUpload = ({ existingPhotos = [], onChange }: SharePhotoUploadProps) => {
  const [keptIds, setKeptIds] = useState<string[]>(existingPhotos.map((p) => p.id))
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setNewPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [newFiles])

  useEffect(() => {
    onChange({ keepPhotoIds: keptIds, newFiles })
  }, [keptIds, newFiles, onChange])

  const keptExisting = existingPhotos.filter((p) => keptIds.includes(p.id))
  const total = keptExisting.length + newFiles.length

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setError(null)

    if (total + files.length > SHARE_PHOTO_MAX_COUNT) {
      setError(`画像は最大${SHARE_PHOTO_MAX_COUNT}枚までです`)
      return
    }
    const tooLarge = files.find((f) => f.size > SHARE_PHOTO_MAX_BYTES)
    if (tooLarge) {
      setError(`画像は1枚あたり${MAX_MB}MBまでです（${tooLarge.name}）`)
      return
    }
    try {
      await validateAllowedImageFiles(files)
      setNewFiles((prev) => [...prev, ...files])
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像の検証に失敗しました')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {keptExisting.map((photo) => (
          <div key={photo.id} className="relative h-20 w-20">
            <img
              src={getSharePhotoUrl(photo.storagePath, { width: 160, height: 160 })}
              alt=""
              className="h-20 w-20 rounded-sm border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => setKeptIds((prev) => prev.filter((id) => id !== photo.id))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white"
              aria-label="画像を削除"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {newPreviews.map((url, i) => (
          <div key={url} className="relative h-20 w-20">
            <img src={url} alt="" className="h-20 w-20 rounded-sm border border-border object-cover" />
            <button
              type="button"
              onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white"
              aria-label="画像を削除"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {total < SHARE_PHOTO_MAX_COUNT && (
          <label
            className={cn(
              'flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm',
              'border border-dashed border-border text-muted-foreground/40 transition-colors hover:border-primary/40 hover:text-primary',
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[9px] font-bold">追加</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground/50">
        最大{SHARE_PHOTO_MAX_COUNT}枚・1枚{MAX_MB}MBまで（JPEG / PNG / WebP）
      </p>
      {error && <p className="mt-1 text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  )
}

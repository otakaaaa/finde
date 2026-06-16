import { useEffect, useState } from 'react'
import { X, ImagePlus, Camera } from 'lucide-react'
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

type DisplayItem =
  | { kind: 'existing'; photo: SharePhoto; url: string }
  | { kind: 'new'; index: number; url: string }

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

  const items: DisplayItem[] = [
    ...keptExisting.map((photo) => ({
      kind: 'existing' as const,
      photo,
      url: getSharePhotoUrl(photo.storagePath, { width: 800, height: 1200 }),
    })),
    ...newPreviews.map((url, index) => ({ kind: 'new' as const, index, url })),
  ]

  const total = items.length
  const canAdd = total < SHARE_PHOTO_MAX_COUNT

  const removeItem = (item: DisplayItem) => {
    if (item.kind === 'existing') {
      setKeptIds((prev) => prev.filter((id) => id !== item.photo.id))
    } else {
      setNewFiles((prev) => prev.filter((_, i) => i !== item.index))
    }
  }

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
      setError(`1枚あたり${MAX_MB}MBまでです`)
      return
    }
    try {
      await validateAllowedImageFiles(files)
      setNewFiles((prev) => [...prev, ...files])
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像の検証に失敗しました')
    }
  }

  const fileInput = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      onChange={handleSelect}
      className="hidden"
    />
  )

  return (
    <div className="space-y-2">
      {total === 0 ? (
        <label className={cn(
          'flex min-h-[340px] cursor-pointer flex-col items-center justify-center gap-4',
          'border border-dashed border-border/60 bg-muted/10',
          'transition-colors hover:border-primary/30 hover:bg-primary/[0.03]',
        )}>
          <Camera className="h-7 w-7 text-muted-foreground/20" />
          <div className="space-y-1.5 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.45em] text-muted-foreground/30">
              写真を追加
            </p>
            <p className="text-[8px] text-muted-foreground/25">
              最大{SHARE_PHOTO_MAX_COUNT}枚 · JPEG / PNG / WebP · {MAX_MB}MB
            </p>
          </div>
          {fileInput}
        </label>
      ) : (
        <>
          {/* Primary photo — large portrait */}
          <div className="relative aspect-[3/4] overflow-hidden bg-muted/20">
            <img
              src={items[0].url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeItem(items[0])}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-black/50 text-white backdrop-blur-sm transition-opacity hover:bg-black/70"
              aria-label="削除"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="absolute bottom-2 left-2 bg-black/35 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.35em] text-white/60 backdrop-blur-sm">
              cover
            </span>
          </div>

          {/* Secondary strip + add button */}
          {(items.length > 1 || canAdd) && (
            <div className="flex gap-1.5">
              {items.slice(1).map((item) => {
                const key = item.kind === 'existing' ? item.photo.id : `new-${item.index}`
                return (
                  <div key={key} className="relative aspect-[3/4] flex-1 overflow-hidden bg-muted/20">
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeItem(item)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-black/50 text-white transition-opacity hover:bg-black/70"
                      aria-label="削除"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )
              })}

              {canAdd && (
                <label className="flex aspect-[3/4] flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-border/50 bg-muted/10 transition-colors hover:border-primary/30">
                  <ImagePlus className="h-4 w-4 text-muted-foreground/25" />
                  <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground/25">追加</span>
                  {fileInput}
                </label>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="text-[10px] font-medium text-red-500">{error}</p>
      )}
    </div>
  )
}

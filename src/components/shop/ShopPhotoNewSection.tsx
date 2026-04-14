import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'

interface ShopPhotoNewSectionProps {
  num: string
  onFilesChange: (files: File[]) => void
  animationDelay?: string
}

export const ShopPhotoNewSection = ({
  num,
  onFilesChange,
  animationDelay = '100ms',
}: ShopPhotoNewSectionProps) => {
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    const urls = pendingFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(urls)
    onFilesChange(pendingFiles)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [pendingFiles, onFilesChange])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setPhotoError(null)
    try {
      await validateAllowedImageFiles(files)
      setPendingFiles((prev) => [...prev, ...files])
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : '画像の検証に失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <section className="wish-card-enter space-y-4" style={{ animationDelay }}>
      <SectionLabel num={num} title="写真" optional />

      <ShopPhotoUploadInput
        onChange={handleFileSelect}
        disabled={uploading}
        uploading={uploading}
      />

      {photoError && (
        <p className="text-[10px] font-medium text-red-500">{photoError}</p>
      )}

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previewUrls.map((url, i) => (
            <div key={url} className="group relative aspect-square overflow-hidden bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className={cn(
                  'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-foreground/70 text-white opacity-0 transition-opacity group-hover:opacity-100',
                )}
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-sm bg-primary/80 px-1 py-0.5 font-headline text-[8px] font-black uppercase tracking-wider text-white">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40">
        JPEG / PNG / WebP · 最大10枚
      </p>
    </section>
  )
}

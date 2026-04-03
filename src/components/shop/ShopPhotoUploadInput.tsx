import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShopPhotoUploadInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  disabled?: boolean
  uploading?: boolean
  className?: string
  inputClassName?: string
  idleLabel?: string
  uploadingLabel?: string
  accept?: string
  multiple?: boolean
}

export const ShopPhotoUploadInput = ({
  onChange,
  disabled = false,
  uploading = false,
  className,
  inputClassName = 'sr-only',
  idleLabel = '写真を追加',
  uploadingLabel = 'アップロード中...',
  accept = 'image/jpeg,image/png,image/webp',
  multiple = true,
}: ShopPhotoUploadInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await onChange(event)
    event.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className={inputClassName}
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-center gap-2 border border-dashed border-border py-8',
          'text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50',
          'transition-colors hover:border-primary/40 hover:text-primary/60 disabled:opacity-40',
          className,
        )}
      >
        <ImagePlus className="h-4 w-4" />
        {uploading ? uploadingLabel : idleLabel}
      </button>
    </>
  )
}

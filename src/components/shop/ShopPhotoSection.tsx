import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { validateAllowedImageFiles } from '@/lib/fileValidation'
import { ShopPhotoUploadInput } from '@/components/shop/ShopPhotoUploadInput'
import { SectionLabel } from '@/components/shop/ShopFormUI'
import { cn } from '@/lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const BUCKET = 'shop-photos'
const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`

interface PhotoRow {
  id: string
  storagePath: string
  order: number
}

const useShopPhotosQuery = (shopId: string) =>
  useQuery({
    queryKey: ['shop-photos', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_photos')
        .select('id, storage_path, order')
        .eq('shop_id', shopId)
        .order('order', { ascending: true }) as unknown as {
          data: { id: string; storage_path: string; order: number }[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return (data ?? []).map((p): PhotoRow => ({
        id: p.id,
        storagePath: p.storage_path,
        order: p.order,
      }))
    },
    enabled: !!shopId,
  })

interface ShopPhotoSectionProps {
  shopId: string
  num: string
  animationDelay?: string
}

export const ShopPhotoSection = ({ shopId, num, animationDelay = '0ms' }: ShopPhotoSectionProps) => {
  const queryClient = useQueryClient()
  const { data: photos = [] } = useShopPhotosQuery(shopId)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const { mutate: deletePhoto, isPending: isDeleting } = useMutation({
    mutationFn: async ({ photoId, storagePath }: { photoId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
      if (storageError) throw new Error(storageError.message)
      const { error: dbError } = await supabase
        .from('shop_photos')
        .delete()
        .eq('id', photoId) as unknown as { error: { message: string } | null }
      if (dbError) throw new Error(dbError.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-photos', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    },
  })

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setPhotoError(null)
    try {
      await validateAllowedImageFiles(files)
      const maxOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.order)) : -1
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${shopId}/${crypto.randomUUID()}.${ext}`
        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)
        const { error: dbErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: shopId, storage_path: path, order: maxOrder + 1 + i } as never) as unknown as {
            error: { message: string } | null
          }
        if (dbErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(dbErr.message)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['shop-photos', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="wish-card-enter space-y-4" style={{ animationDelay }}>
      <SectionLabel num={num} title="写真" optional />

      <ShopPhotoUploadInput
        onChange={handlePhotoFileChange}
        disabled={uploading || isDeleting}
        uploading={uploading}
      />

      {photoError && (
        <p className="text-[10px] font-medium text-red-500">{photoError}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden bg-muted">
              <img src={getPhotoUrl(photo.storagePath)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => deletePhoto({ photoId: photo.id, storagePath: photo.storagePath })}
                disabled={uploading || isDeleting}
                className={cn(
                  'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-foreground/70 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40',
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

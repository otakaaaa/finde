import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ShopPhoto } from '@/types'

interface ShopPhotosManagerProps {
  shopId: string
}

interface PhotoRow {
  id: string
  shop_id: string
  storage_path: string
  order: number
  created_at: string
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const BUCKET = 'shop-photos'

const getPhotoUrl = (storagePath: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`

const useShopPhotos = (shopId: string) =>
  useQuery({
    queryKey: ['shop-photos', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_photos')
        .select('id, shop_id, storage_path, order, created_at')
        .eq('shop_id', shopId)
        .order('order', { ascending: true }) as unknown as Promise<{ data: PhotoRow[] | null; error: { message: string } | null }>
      if (error) throw new Error(error.message)
      return (data ?? []).map((p): ShopPhoto => ({
        id: p.id,
        shopId: p.shop_id,
        storagePath: p.storage_path,
        order: p.order,
        createdAt: p.created_at,
      }))
    },
    enabled: !!shopId,
  })

export const ShopPhotosManager = ({ shopId }: ShopPhotosManagerProps) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: photos = [] } = useShopPhotos(shopId)

  const { mutate: deletePhoto, isPending: isDeleting } = useMutation({
    mutationFn: async ({ photoId, storagePath }: { photoId: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath])
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setUploadError(null)

    try {
      const maxOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.order)) : -1

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `${shopId}/${crypto.randomUUID()}.${ext}`

        const { error: storageErr } = await supabase.storage.from(BUCKET).upload(path, file)
        if (storageErr) throw new Error(storageErr.message)

        const { error: dbErr } = await supabase
          .from('shop_photos')
          .insert({ shop_id: shopId, storage_path: path, order: maxOrder + 1 + i } as never) as unknown as { error: { message: string } | null }

        if (dbErr) {
          await supabase.storage.from(BUCKET).remove([path])
          throw new Error(dbErr.message)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['shop-photos', shopId] })
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const disabled = uploading || isDeleting

  return (
    <div className="space-y-3">
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <img
                src={getPhotoUrl(photo.storagePath)}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => deletePhoto({ photoId: photo.id, storagePath: photo.storagePath })}
                disabled={disabled}
                className="absolute right-1 top-1 hidden rounded-full bg-red-600 p-1 text-white shadow group-hover:flex disabled:opacity-50"
                aria-label="削除"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? 'アップロード中...' : '画像を追加'}
      </Button>
      <p className="text-xs text-muted-foreground">JPEG・PNG・WebP、各10MB以内。複数選択可。</p>
    </div>
  )
}

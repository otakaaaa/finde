import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL as string

export const getR2Url = (bucket: string, storagePath: string): string =>
  `${R2_PUBLIC_URL}/${bucket}/${storagePath}`

const compressImage = (file: File): Promise<File> =>
  imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
  })

export const uploadToR2 = async (bucket: string, path: string, file: File): Promise<void> => {
  const compressed = await compressImage(file)

  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { bucket, path },
  })
  if (error) throw new Error(error.message)

  const uploadUrl = (data as { uploadUrl: string }).uploadUrl
  if (!uploadUrl) throw new Error('presigned URL の取得に失敗しました')

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: compressed,
    headers: {
      // presign 側で署名された Content-Type と一致させる必要がある。
      'Content-Type': 'image/webp',
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    },
  })
  if (!res.ok) throw new Error(`R2 アップロードに失敗しました: ${res.status}`)
}

export const deleteFromR2 = async (bucket: string, paths: string[]): Promise<void> => {
  const { error } = await supabase.functions.invoke('r2-delete', {
    body: { bucket, paths },
  })
  if (error) throw new Error(error.message)
}

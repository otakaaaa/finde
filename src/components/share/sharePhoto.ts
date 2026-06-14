const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface ResizeOpts {
  width?: number
  height?: number
}

const publicUrl = (bucket: string, path: string, opts?: ResizeOpts) => {
  const base = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  if (!opts) return base
  const params = new URLSearchParams()
  if (opts.width) params.set('width', String(opts.width))
  if (opts.height) params.set('height', String(opts.height))
  params.set('resize', 'cover')
  return `${base}?${params.toString()}`
}

/** シャレ活の投稿画像URL */
export const getSharePhotoUrl = (path: string, opts?: ResizeOpts) =>
  publicUrl('share-photos', path, opts)

/** 関連店舗のカバー画像URL */
export const getShopCoverUrl = (path: string) =>
  publicUrl('shop-photos', path, { width: 64, height: 64 })

/** 1枚あたりの最大サイズ（5 MiB、バケット制限と一致） */
export const SHARE_PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const SHARE_PHOTO_MAX_COUNT = 5

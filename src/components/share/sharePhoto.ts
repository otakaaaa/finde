import { getR2Url } from '@/lib/r2'

interface ResizeOpts {
  width?: number
  height?: number
}

/** シャレ活の投稿画像URL */
export const getSharePhotoUrl = (path: string, _opts?: ResizeOpts) =>
  getR2Url('share-photos', path)

/** 関連店舗のカバー画像URL */
export const getShopCoverUrl = (path: string) => getR2Url('shop-photos', path)

/** 1枚あたりの最大サイズ（5 MiB、バケット制限と一致） */
export const SHARE_PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const SHARE_PHOTO_MAX_COUNT = 4

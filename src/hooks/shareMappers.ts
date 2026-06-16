import type { SharePost, ShareComment, SharePhoto, SharePostShop } from '@/types'

// ── Supabase 行の型（select で取得する形）──────────────────────

interface ShareUserRow {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface SharePhotoRow {
  id: string
  post_id: string
  storage_path: string
  order: number
  created_at: string
}

interface SharePostShopRow {
  shops: {
    id: string
    name: string
    shop_photos: { storage_path: string; order: number }[] | null
  } | null
}

interface ShareBookmarkRow {
  user_id: string
}

export interface SharePostRow {
  id: string
  user_id: string
  body: string
  state: SharePost['state']
  visibility: SharePost['visibility']
  status: SharePost['status']
  published_at: string | null
  impression_count: number
  rating_count: number
  rating_sum: number
  comment_count: number
  bookmark_count: number
  created_at: string
  updated_at: string
  user: ShareUserRow | null
  photos: SharePhotoRow[] | null
  shops: SharePostShopRow[] | null
  bookmarks: ShareBookmarkRow[] | null
}

export interface ShareCommentRow {
  id: string
  post_id: string
  user_id: string
  body: string
  status: 'published' | 'hidden'
  created_at: string
  updated_at: string
  user: ShareUserRow | null
}

// ブックマーク有無を除いた基本 select（入れ子 embed での自己参照を避ける用途）
export const SHARE_POST_SELECT_BASE = `
  id, user_id, body, state, visibility, status, published_at,
  impression_count, rating_count, rating_sum, comment_count, bookmark_count,
  created_at, updated_at,
  user:users!user_id ( id, display_name, avatar_url ),
  photos:share_post_photos ( id, post_id, storage_path, order, created_at ),
  shops:share_post_shops ( shops ( id, name, shop_photos ( storage_path, order ) ) )
` as const

// 投稿/詳細 select（閲覧者のブックマーク有無を含む）
export const SHARE_POST_SELECT = `
  ${SHARE_POST_SELECT_BASE},
  bookmarks:share_bookmarks ( user_id )
` as const

export const SHARE_COMMENT_SELECT = `
  id, post_id, user_id, body, status, created_at, updated_at,
  user:users!user_id ( id, display_name, avatar_url )
` as const

const EMPTY_USER = { id: '', displayName: null, avatarUrl: null }

const mapUser = (u: ShareUserRow | null): SharePost['user'] =>
  u ? { id: u.id, displayName: u.display_name, avatarUrl: u.avatar_url } : EMPTY_USER

const mapPhotos = (rows: SharePhotoRow[] | null): SharePhoto[] =>
  (rows ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.id,
      postId: p.post_id,
      storagePath: p.storage_path,
      order: p.order,
      createdAt: p.created_at,
    }))

const mapShops = (rows: SharePostShopRow[] | null): SharePostShop[] =>
  (rows ?? [])
    .filter((r): r is SharePostShopRow & { shops: NonNullable<SharePostShopRow['shops']> } => r.shops !== null)
    .map((r) => {
      const cover = (r.shops.shop_photos ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)[0]
      return {
        id: r.shops.id,
        name: r.shops.name,
        coverPhotoPath: cover?.storage_path ?? null,
      }
    })

export const mapSharePostRow = (row: SharePostRow, myScore: number | null): SharePost => ({
  id: row.id,
  userId: row.user_id,
  user: mapUser(row.user),
  body: row.body,
  state: row.state,
  visibility: row.visibility,
  status: row.status,
  publishedAt: row.published_at,
  photos: mapPhotos(row.photos),
  shops: mapShops(row.shops),
  impressionCount: row.impression_count,
  ratingCount: row.rating_count,
  ratingSum: row.rating_sum,
  commentCount: row.comment_count,
  bookmarkCount: row.bookmark_count,
  averageScore: row.rating_count > 0 ? row.rating_sum / row.rating_count : null,
  myScore,
  isBookmarked: (row.bookmarks?.length ?? 0) > 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapShareCommentRow = (row: ShareCommentRow): ShareComment => ({
  id: row.id,
  postId: row.post_id,
  userId: row.user_id,
  user: mapUser(row.user),
  body: row.body,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

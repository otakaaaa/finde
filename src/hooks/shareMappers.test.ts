import { describe, it, expect } from 'vitest'
import { mapSharePostRow, mapShareCommentRow, type SharePostRow, type ShareCommentRow } from './shareMappers'

const baseRow = (overrides: Partial<SharePostRow> = {}): SharePostRow => ({
  id: 'p1',
  user_id: 'u1',
  body: 'hello',
  state: 'published',
  visibility: 'public',
  status: 'published',
  published_at: '2026-06-14T00:00:00Z',
  impression_count: 10,
  rating_count: 0,
  rating_sum: 0,
  comment_count: 0,
  bookmark_count: 0,
  created_at: '2026-06-14T00:00:00Z',
  updated_at: '2026-06-14T00:00:00Z',
  user: { id: 'u1', display_name: 'Taro', avatar_url: null },
  photos: null,
  shops: null,
  bookmarks: null,
  ...overrides,
})

describe('mapSharePostRow', () => {
  it('ratingSum（シャレ度合計）と ratingCount をそのままマップする', () => {
    const post = mapSharePostRow(baseRow({ rating_count: 4, rating_sum: 30 }), null)
    expect(post.ratingSum).toBe(30)
    expect(post.ratingCount).toBe(4)
  })

  it('票がなければ ratingSum は 0', () => {
    const post = mapSharePostRow(baseRow(), null)
    expect(post.ratingSum).toBe(0)
    expect(post.ratingCount).toBe(0)
  })

  it('isBookmarked は bookmarks 行の有無で決まる', () => {
    expect(mapSharePostRow(baseRow({ bookmarks: [{ user_id: 'u9', folder_id: null }] }), null).isBookmarked).toBe(true)
    expect(mapSharePostRow(baseRow({ bookmarks: [] }), null).isBookmarked).toBe(false)
    expect(mapSharePostRow(baseRow({ bookmarks: null }), null).isBookmarked).toBe(false)
  })

  it('myScore を反映する', () => {
    expect(mapSharePostRow(baseRow(), 8).myScore).toBe(8)
  })

  it('photos は order 昇順に整列する', () => {
    const post = mapSharePostRow(
      baseRow({
        photos: [
          { id: 'b', post_id: 'p1', storage_path: 'b.jpg', order: 1, created_at: '' },
          { id: 'a', post_id: 'p1', storage_path: 'a.jpg', order: 0, created_at: '' },
        ],
      }),
      null,
    )
    expect(post.photos.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('shops のカバー画像は order 最小を採用、null shops は除外', () => {
    const post = mapSharePostRow(
      baseRow({
        shops: [
          { shops: { id: 's1', name: 'Shop1', shop_photos: [{ storage_path: 'x.jpg', order: 2 }, { storage_path: 'y.jpg', order: 0 }] } },
          { shops: null },
        ],
      }),
      null,
    )
    expect(post.shops).toHaveLength(1)
    expect(post.shops[0].coverPhotoPath).toBe('y.jpg')
  })
})

describe('mapShareCommentRow', () => {
  it('行を ShareComment に変換する', () => {
    const row: ShareCommentRow = {
      id: 'c1',
      post_id: 'p1',
      user_id: 'u2',
      body: 'nice',
      status: 'published',
      created_at: '2026-06-14T00:00:00Z',
      updated_at: '2026-06-14T00:00:00Z',
      user: { id: 'u2', display_name: 'Hanako', avatar_url: null },
    }
    const comment = mapShareCommentRow(row)
    expect(comment.user.displayName).toBe('Hanako')
    expect(comment.body).toBe('nice')
  })
})

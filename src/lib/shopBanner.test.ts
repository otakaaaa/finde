import { describe, it, expect } from 'vitest'
import {
  isBannerLive,
  formatBannerPeriod,
  toLocalDatetimeInput,
  toNullableInput,
  hasBannerPlacement,
  bannerPlacementLabel,
} from '@/lib/shopBanner'
import type { ShopBanner } from '@/types'

const baseBanner: ShopBanner = {
  id: 'b1',
  shopId: 's1',
  imagePath: 's1/abc.webp',
  linkUrl: null,
  order: 0,
  isActive: true,
  startsAt: null,
  endsAt: null,
  placements: ['shop_detail'],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const NOW = new Date('2026-06-23T12:00:00Z').getTime()

describe('isBannerLive', () => {
  it('is_active かつ 期間指定なしなら掲載中', () => {
    expect(isBannerLive(baseBanner, NOW)).toBe(true)
  })

  it('is_active=false なら非掲載', () => {
    expect(isBannerLive({ ...baseBanner, isActive: false }, NOW)).toBe(false)
  })

  it('開始日時が未来なら非掲載', () => {
    expect(isBannerLive({ ...baseBanner, startsAt: '2026-06-24T00:00:00Z' }, NOW)).toBe(false)
  })

  it('開始日時が過去なら掲載中', () => {
    expect(isBannerLive({ ...baseBanner, startsAt: '2026-06-22T00:00:00Z' }, NOW)).toBe(true)
  })

  it('終了日時が過去なら非掲載', () => {
    expect(isBannerLive({ ...baseBanner, endsAt: '2026-06-22T00:00:00Z' }, NOW)).toBe(false)
  })

  it('終了日時が未来なら掲載中', () => {
    expect(isBannerLive({ ...baseBanner, endsAt: '2026-06-24T00:00:00Z' }, NOW)).toBe(true)
  })

  it('期間内（開始 < now < 終了）なら掲載中', () => {
    expect(
      isBannerLive(
        { ...baseBanner, startsAt: '2026-06-22T00:00:00Z', endsAt: '2026-06-24T00:00:00Z' },
        NOW,
      ),
    ).toBe(true)
  })
})

describe('formatBannerPeriod', () => {
  it('期間指定なしは「常時掲載」', () => {
    expect(formatBannerPeriod(baseBanner)).toBe('常時掲載')
  })

  it('開始のみ指定は「即時」を含まず開始日時〜無期限', () => {
    const result = formatBannerPeriod({ ...baseBanner, startsAt: '2026-06-22T00:00:00Z' })
    expect(result).toContain('〜 無期限')
  })

  it('終了のみ指定は「即時 〜 終了日時」', () => {
    const result = formatBannerPeriod({ ...baseBanner, endsAt: '2026-06-24T00:00:00Z' })
    expect(result).toContain('即時 〜')
  })
})

describe('toLocalDatetimeInput', () => {
  it('null は空文字を返す', () => {
    expect(toLocalDatetimeInput(null)).toBe('')
  })

  it('ISO文字列を datetime-local 形式（分まで）に変換する', () => {
    const result = toLocalDatetimeInput('2026-06-23T12:34:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})

describe('toNullableInput', () => {
  it('空文字や空白のみは null', () => {
    expect(toNullableInput('')).toBeNull()
    expect(toNullableInput('   ')).toBeNull()
  })

  it('値があれば前後空白を除去して返す', () => {
    expect(toNullableInput('  https://example.com  ')).toBe('https://example.com')
  })
})

describe('hasBannerPlacement', () => {
  it('含まれる表示位置は true', () => {
    expect(hasBannerPlacement(baseBanner, 'shop_detail')).toBe(true)
  })

  it('含まれない表示位置は false', () => {
    expect(hasBannerPlacement(baseBanner, 'favorite_button')).toBe(false)
  })

  it('複数指定のいずれも判定できる', () => {
    const banner: ShopBanner = { ...baseBanner, placements: ['shop_detail', 'favorite_button'] }
    expect(hasBannerPlacement(banner, 'favorite_button')).toBe(true)
    expect(hasBannerPlacement(banner, 'shop_detail')).toBe(true)
  })
})

describe('bannerPlacementLabel', () => {
  it('既知の値は日本語ラベルを返す', () => {
    expect(bannerPlacementLabel('shop_detail')).toBe('店舗詳細ページ上部')
    expect(bannerPlacementLabel('favorite_button')).toBe('お気に入りボタンの上')
  })
})

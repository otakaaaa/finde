import { describe, it, expect } from 'vitest'
import {
  isAnnouncementLive,
  formatAnnouncementPeriod,
  formatAnnouncementDate,
  toLocalDatetimeInput,
  toNullableInput,
} from '@/lib/shopAnnouncement'
import type { ShopAnnouncement } from '@/types'

const baseAnnouncement: ShopAnnouncement = {
  id: 'a1',
  shopId: 's1',
  title: '夏季セールのお知らせ',
  body: '本文',
  linkUrl: null,
  imagePath: null,
  isActive: true,
  startsAt: null,
  endsAt: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const NOW = new Date('2026-06-23T12:00:00Z').getTime()

describe('isAnnouncementLive', () => {
  it('is_active かつ 期間指定なしなら掲載中', () => {
    expect(isAnnouncementLive(baseAnnouncement, NOW)).toBe(true)
  })

  it('is_active=false なら非掲載', () => {
    expect(isAnnouncementLive({ ...baseAnnouncement, isActive: false }, NOW)).toBe(false)
  })

  it('開始日時が未来なら非掲載', () => {
    expect(isAnnouncementLive({ ...baseAnnouncement, startsAt: '2026-06-24T00:00:00Z' }, NOW)).toBe(false)
  })

  it('開始日時が過去なら掲載中', () => {
    expect(isAnnouncementLive({ ...baseAnnouncement, startsAt: '2026-06-22T00:00:00Z' }, NOW)).toBe(true)
  })

  it('終了日時が過去なら非掲載', () => {
    expect(isAnnouncementLive({ ...baseAnnouncement, endsAt: '2026-06-22T00:00:00Z' }, NOW)).toBe(false)
  })

  it('終了日時が未来なら掲載中', () => {
    expect(isAnnouncementLive({ ...baseAnnouncement, endsAt: '2026-06-24T00:00:00Z' }, NOW)).toBe(true)
  })

  it('期間内（開始 < now < 終了）なら掲載中', () => {
    expect(
      isAnnouncementLive(
        { ...baseAnnouncement, startsAt: '2026-06-22T00:00:00Z', endsAt: '2026-06-24T00:00:00Z' },
        NOW,
      ),
    ).toBe(true)
  })
})

describe('formatAnnouncementPeriod', () => {
  it('期間指定なしは「常時掲載」', () => {
    expect(formatAnnouncementPeriod(baseAnnouncement)).toBe('常時掲載')
  })

  it('開始のみ指定は「〜 無期限」を含む', () => {
    const result = formatAnnouncementPeriod({ ...baseAnnouncement, startsAt: '2026-06-22T00:00:00Z' })
    expect(result).toContain('〜 無期限')
  })

  it('終了のみ指定は「即時 〜」を含む', () => {
    const result = formatAnnouncementPeriod({ ...baseAnnouncement, endsAt: '2026-06-24T00:00:00Z' })
    expect(result).toContain('即時 〜')
  })
})

describe('formatAnnouncementDate', () => {
  it('starts_at があればそれを公開日とする', () => {
    const result = formatAnnouncementDate({ ...baseAnnouncement, startsAt: '2026-06-22T00:00:00Z' })
    expect(result).toContain('2026')
  })

  it('starts_at がなければ created_at を公開日とする', () => {
    const result = formatAnnouncementDate(baseAnnouncement)
    expect(result).toContain('2026')
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

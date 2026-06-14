import { describe, it, expect } from 'vitest'
import {
  weightedLength,
  trimToWeight,
  buildShareTweetText,
  SHARE_HASHTAGS,
  TWEET_MAX_WEIGHT,
  URL_WEIGHT,
} from './shareTweet'

describe('weightedLength', () => {
  it('ASCII は1文字=1', () => {
    expect(weightedLength('abc')).toBe(3)
  })

  it('CJK/全角かなは1文字=2', () => {
    expect(weightedLength('あ')).toBe(2)
    expect(weightedLength('シャレ活')).toBe(8)
  })

  it('混在を合算する', () => {
    expect(weightedLength('a あ')).toBe(1 + 1 + 2) // 'a' + 半角space + 'あ'
  })
})

describe('trimToWeight', () => {
  it('予算内ならそのまま返す', () => {
    expect(trimToWeight('hello', 10)).toBe('hello')
  })

  it('超過時は末尾を … で省略し、重みが予算内に収まる', () => {
    const out = trimToWeight('あいうえお', 6) // 各2 → 全体10
    expect(out.endsWith('…')).toBe(true)
    expect(weightedLength(out)).toBeLessThanOrEqual(6)
  })
})

describe('buildShareTweetText', () => {
  it('ハッシュタグを必ず含む', () => {
    expect(buildShareTweetText('test')).toContain(SHARE_HASHTAGS.trim())
  })

  it('日本語長文でも URL を加味して重み280を超えない', () => {
    const longJa = 'あ'.repeat(1000)
    const text = buildShareTweetText(longJa)
    expect(weightedLength(text) + URL_WEIGHT).toBeLessThanOrEqual(TWEET_MAX_WEIGHT)
  })

  it('短い本文は省略されない', () => {
    const text = buildShareTweetText('今日のコーデ')
    expect(text.startsWith('今日のコーデ')).toBe(true)
    expect(text).not.toContain('…')
  })
})

import { describe, it, expect } from 'vitest'
import { isSafeHttpUrl, safeExternalHref, optionalHttpUrlSchema } from '@/lib/url'

describe('isSafeHttpUrl', () => {
  it('http/https を許可する', () => {
    expect(isSafeHttpUrl('http://example.com')).toBe(true)
    expect(isSafeHttpUrl('https://example.com/path?q=1')).toBe(true)
  })

  it('危険なスキームを拒否する', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('JavaScript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false)
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false)
  })

  it('空・不正な値を拒否する', () => {
    expect(isSafeHttpUrl('')).toBe(false)
    expect(isSafeHttpUrl(null)).toBe(false)
    expect(isSafeHttpUrl(undefined)).toBe(false)
    expect(isSafeHttpUrl('not a url')).toBe(false)
  })
})

describe('safeExternalHref', () => {
  it('安全な URL はそのまま返す', () => {
    expect(safeExternalHref('https://example.com')).toBe('https://example.com')
  })

  it('危険な URL は undefined を返す', () => {
    expect(safeExternalHref('javascript:alert(1)')).toBeUndefined()
    expect(safeExternalHref(null)).toBeUndefined()
  })
})

describe('optionalHttpUrlSchema', () => {
  it('空文字は許可する（任意項目）', () => {
    expect(optionalHttpUrlSchema.safeParse('').success).toBe(true)
    expect(optionalHttpUrlSchema.safeParse(undefined).success).toBe(true)
  })

  it('http/https を許可する', () => {
    expect(optionalHttpUrlSchema.safeParse('https://example.com').success).toBe(true)
  })

  it('javascript: を拒否する', () => {
    expect(optionalHttpUrlSchema.safeParse('javascript:alert(1)').success).toBe(false)
  })
})

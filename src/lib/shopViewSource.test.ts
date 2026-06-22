import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveShopViewSource } from './shopViewSource'

const setReferrer = (value: string) => {
  vi.spyOn(document, 'referrer', 'get').mockReturnValue(value)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('resolveShopViewSource', () => {
  it('location.state.source が有効ならそれを優先する', () => {
    setReferrer('https://example.com/share')
    expect(resolveShopViewSource({ source: 'area' })).toBe('area')
  })

  it('location.state.source が無効なら referrer で判定する', () => {
    setReferrer(`${window.location.origin}/shops`)
    expect(resolveShopViewSource({ source: 'invalid' })).toBe('search')
  })

  it('同一オリジンの referrer パスから判定する', () => {
    setReferrer(`${window.location.origin}/brands/abc`)
    expect(resolveShopViewSource()).toBe('brand')
    setReferrer(`${window.location.origin}/share/xyz`)
    expect(resolveShopViewSource()).toBe('share')
    setReferrer(`${window.location.origin}/shops?prefecture=13`)
    expect(resolveShopViewSource()).toBe('search')
  })

  it('外部 referrer は direct 扱い', () => {
    setReferrer('https://www.google.com/')
    expect(resolveShopViewSource()).toBe('direct')
  })

  it('referrer が空なら direct', () => {
    setReferrer('')
    expect(resolveShopViewSource()).toBe('direct')
  })
})

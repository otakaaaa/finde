import { describe, it, expect } from 'vitest'
// CLI スクリプトから純粋関数のみを import（import.meta のガードで走査は走らない）
import { findHiddenChars } from '../../scripts/check-hidden-unicode.mjs'

// 危険文字はリテラルで書かず String.fromCodePoint で構築する
const ch = (cp: number) => String.fromCodePoint(cp)

describe('findHiddenChars', () => {
  it('通常のコード・日本語・絵文字では何も検出しない', () => {
    expect(findHiddenChars('const x = 1 // 日本語コメント 😀👍')).toEqual([])
    // ZWJ を含む絵文字シーケンス（家族絵文字）は誤検知しない
    expect(findHiddenChars('👨‍👩‍👧')).toEqual([])
  })

  it('双方向オーバーライド（Trojan Source）を検出する', () => {
    const evil = `access = ${ch(0x202e)}"admin"`
    const found = findHiddenChars(evil)
    expect(found).toHaveLength(1)
    expect(found[0].codePoint).toBe(0x202e)
  })

  it('ゼロ幅スペースを検出する', () => {
    const found = findHiddenChars(`is${ch(0x200b)}Admin`)
    expect(found).toHaveLength(1)
    expect(found[0].codePoint).toBe(0x200b)
  })

  it('行番号・列番号を正しく報告する', () => {
    const text = `line1\nline2${ch(0x200b)}x`
    const found = findHiddenChars(text)
    expect(found).toHaveLength(1)
    expect(found[0].line).toBe(2)
    expect(found[0].column).toBe(6)
  })

  it('先頭 BOM は許容し、行中の U+FEFF は検出する', () => {
    expect(findHiddenChars(`${ch(0xfeff)}const x = 1`)).toEqual([])
    expect(findHiddenChars(`const${ch(0xfeff)}x`)).toHaveLength(1)
  })
})

// scripts/check-hidden-unicode.mjs の型宣言（テスト等から型付きで import するため）
export declare const HIDDEN_CODEPOINTS: Map<number, string>

export interface HiddenCharFinding {
  index: number
  line: number
  column: number
  codePoint: number
  name: string
}

export declare function findHiddenChars(text: string): HiddenCharFinding[]

import { z } from 'zod'

/**
 * 外部リンク用の URL 安全化ユーティリティ。
 *
 * `javascript:` / `data:` / `vblob:` などのスキームを許すと、ユーザー入力の
 * URL をそのまま <a href> に渡した際に格納型 XSS になり得る。表示側と入力
 * バリデーションの両方で http/https のみに制限する。
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

/** http/https スキームの妥当な絶対 URL なら true。 */
export const isSafeHttpUrl = (value: string | null | undefined): boolean => {
  if (!value) return false
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  return SAFE_PROTOCOLS.has(parsed.protocol)
}

/**
 * <a href> に渡して安全な URL を返す。安全でなければ undefined を返し、
 * 呼び出し側はリンクを描画しない / href を付けない選択ができる。
 * 既に DB に保存済みの不正な値も無害化できる（表示時の防御）。
 */
export const safeExternalHref = (value: string | null | undefined): string | undefined =>
  isSafeHttpUrl(value) ? (value as string) : undefined

/**
 * フォーム入力用の zod スキーマ。空文字は許可（任意項目）、値がある場合は
 * http/https の URL のみ許可する。
 */
export const optionalHttpUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || isSafeHttpUrl(v), {
    message: 'http:// または https:// で始まる有効なURLを入力してください',
  })
  .optional()
  .or(z.literal(''))

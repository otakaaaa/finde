/**
 * サイト全体のSEO関連デフォルト値。
 * 本番URLは vite.config / robots.txt と揃えること。
 */
export const SITE = {
  name: 'FINDE',
  url: 'https://finde-cloud.com',
  locale: 'ja_JP',
  defaultDescription:
    '洋服好き・子ども服を探している人向けに、店舗と取り扱いブランドを比較しながら「行きたいお店」が見つかる服屋検索サービス。',
} as const

/**
 * 相対パスをサイトの絶対URLへ変換する。
 * 既に http(s) で始まる場合はそのまま返す。
 */
export const toAbsoluteUrl = (path?: string): string => {
  if (!path) return SITE.url
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`
}

import { SITE, toAbsoluteUrl } from '../../config/site'

/**
 * 1ページ分のSEOメタ情報。SSR(Pages Function)での <head> 注入に用いる。
 * クライアント側の React <Seo> コンポーネントと内容を揃えること。
 */
export interface PageMeta {
  /** サイト名付与済みの完全なタイトル */
  title: string
  description: string
  /** canonical / og:url 用のパス（例: /shops/123） */
  canonicalPath: string
  /** OGP / Twitter カード用の絶対URL画像 */
  image?: string
  type: 'website' | 'article'
  noindex: boolean
  /** 構造化データ（JSON-LD）。複数可。 */
  jsonLd?: Record<string, unknown>[]
}

/** HTML属性値・テキスト用のエスケープ */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** </script> によるブレイクアウトを防いだ JSON-LD 文字列 */
const serializeJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, '\\u003c')

/**
 * PageMeta から <head> に挿入する HTML 文字列を生成する。
 * 各タグには data-seo-ssr 属性を付け、クライアント起動時に除去できるようにする。
 */
export const buildHeadTags = (meta: PageMeta): string => {
  const url = toAbsoluteUrl(meta.canonicalPath)
  const image = toAbsoluteUrl(meta.image ?? SITE.defaultImage)
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const ssr = 'data-seo-ssr'

  const tags: string[] = [
    `<title ${ssr}>${title}</title>`,
    `<meta ${ssr} name="description" content="${description}" />`,
    `<link ${ssr} rel="canonical" href="${escapeHtml(url)}" />`,
  ]

  if (meta.noindex) {
    tags.push(`<meta ${ssr} name="robots" content="noindex, nofollow" />`)
  }

  // Open Graph
  tags.push(
    `<meta ${ssr} property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `<meta ${ssr} property="og:locale" content="${SITE.locale}" />`,
    `<meta ${ssr} property="og:type" content="${meta.type}" />`,
    `<meta ${ssr} property="og:title" content="${title}" />`,
    `<meta ${ssr} property="og:description" content="${description}" />`,
    `<meta ${ssr} property="og:url" content="${escapeHtml(url)}" />`,
  )
  tags.push(`<meta ${ssr} property="og:image" content="${escapeHtml(image)}" />`)

  // Twitter
  tags.push(
    `<meta ${ssr} name="twitter:card" content="summary_large_image" />`,
    `<meta ${ssr} name="twitter:title" content="${title}" />`,
    `<meta ${ssr} name="twitter:description" content="${description}" />`,
    `<meta ${ssr} name="twitter:image" content="${escapeHtml(image)}" />`,
  )

  // JSON-LD
  for (const data of meta.jsonLd ?? []) {
    tags.push(`<script ${ssr} type="application/ld+json">${serializeJsonLd(data)}</script>`)
  }

  return tags.join('')
}

/** サイト名を末尾に付与した完全タイトルを作る */
export const composeTitle = (core: string, appendSiteName = true): string =>
  appendSiteName ? `${core}｜${SITE.name}` : core

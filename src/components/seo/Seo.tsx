import { SITE, toAbsoluteUrl } from '@/config/site'

interface SeoProps {
  /** ページ固有のタイトル（既定でサイト名が末尾に付与される） */
  title: string
  /** メタディスクリプション（未指定ならサイト共通の説明文） */
  description?: string
  /** canonical / og:url 用のパス（例: /shops/123）。未指定ならサイトトップ */
  path?: string
  /** OGP / Twitter カード用の画像URL（相対パス可） */
  image?: string
  /** og:type（記事系は 'article'） */
  type?: 'website' | 'article'
  /** 検索エンジンにインデックスさせない場合 true */
  noindex?: boolean
  /** タイトル末尾へのサイト名付与を無効化する場合 false */
  appendSiteName?: boolean
}

/**
 * React 19 ネイティブの document metadata 機能を用いて、
 * ページ個別の title / description / canonical / OGP / Twitter カードを <head> に出力する。
 * 各公開ページで1つだけレンダリングすること（複数の description が重複しないように）。
 */
export const Seo = ({
  title,
  description = SITE.defaultDescription,
  path,
  image,
  type = 'website',
  noindex = false,
  appendSiteName = true,
}: SeoProps) => {
  const fullTitle = appendSiteName ? `${title}｜${SITE.name}` : title
  const url = toAbsoluteUrl(path)
  const imageUrl = toAbsoluteUrl(image ?? SITE.defaultImage)

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  )
}

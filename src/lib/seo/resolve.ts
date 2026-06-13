import { SITE } from '../../config/site'
import { composeTitle, type PageMeta } from './meta'

export interface SupabaseConfig {
  url: string
  key: string
}

/** 静的ページの title(コア) / description 定義。React 側の <Seo> と内容を揃える。 */
const STATIC_PAGES: Record<string, { core: string; description: string }> = {
  '/': { core: 'セレクトショップ・古着屋検索', description: SITE.defaultDescription },
  '/shops': {
    core: '店舗を探す',
    description:
      '全国のセレクトショップ・古着屋を、地域・カテゴリ・取り扱いブランドで絞り込んで検索。あなたが「探していたお店」がFINDEで見つかります。',
  },
  '/brands': {
    core: 'ブランドから探す',
    description:
      '取り扱いブランドからセレクトショップ・古着屋を検索。気になるブランドを扱っているお店をFINDEで見つけられます。',
  },
  '/news': { core: 'お知らせ', description: 'FINDEからのお知らせ・新着情報・アップデートの一覧。' },
  '/about': {
    core: 'FINDEについて',
    description:
      'FINDEは、店舗と取り扱いブランドを比較しながら「行きたいお店」が見つかる服屋検索サービスです。サービスの想いと特徴をご紹介します。',
  },
  '/faq': {
    core: 'よくあるご質問',
    description: 'FINDEの使い方・店舗掲載・オーナー登録などに関するよくある質問と回答をまとめています。',
  },
  '/contact': {
    core: 'お問い合わせ',
    description: 'FINDEへのお問い合わせ・ご要望・店舗情報の修正依頼はこちらのフォームからお送りください。',
  },
  '/terms': { core: '利用規約', description: 'FINDEの利用規約。本サービスをご利用いただく前にご確認ください。' },
  '/privacy': {
    core: 'プライバシーポリシー',
    description: 'FINDEのプライバシーポリシー。お客様の個人情報の取り扱いについてご説明します。',
  },
}

/** 検索エンジンにインデックスさせないパスの接頭辞 */
const PRIVATE_PREFIXES = [
  '/auth',
  '/mypage',
  '/admin',
  '/owner',
  '/wishes',
  '/owner-application',
  '/listing-request',
]

const truncate = (value: string, max = 120): string =>
  value.length > max ? `${value.slice(0, max)}…` : value

const stripMarkdown = (markdown: string): string =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const shopPhotoUrl = (config: SupabaseConfig, storagePath: string): string =>
  `${config.url}/storage/v1/object/public/shop-photos/${storagePath}?width=1200&resize=cover`

/** PostgREST へ GET し、結果配列の先頭を返す（失敗時は null） */
const fetchOne = async <T>(config: SupabaseConfig, path: string): Promise<T | null> => {
  try {
    const res = await fetch(`${config.url}/rest/v1/${path}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as T[]
    return rows[0] ?? null
  } catch {
    return null
  }
}

const defaultMeta = (pathname: string): PageMeta => ({
  title: composeTitle(SITE.name, false),
  description: SITE.defaultDescription,
  canonicalPath: pathname,
  type: 'website',
  noindex: PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)),
})

interface ShopRow {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  average_rating: number | null
  review_count: number | null
  areas: { prefecture: string | null; city: string | null } | null
  shop_photos: { storage_path: string }[] | null
  shop_categories: { categories: { name: string } | null }[] | null
}

const resolveShopMeta = async (
  config: SupabaseConfig,
  id: string,
  pathname: string,
): Promise<PageMeta> => {
  const select =
    'id,name,description,address,phone,average_rating,review_count,' +
    'areas:area_id(prefecture,city),shop_photos(storage_path),shop_categories(categories(name))'
  const shop = await fetchOne<ShopRow>(
    config,
    `shops?id=eq.${encodeURIComponent(id)}&status=eq.public&select=${encodeURIComponent(select)}`,
  )

  if (!shop) {
    return { ...defaultMeta(pathname), title: composeTitle('店舗が見つかりません'), noindex: true }
  }

  const location = [shop.areas?.prefecture, shop.areas?.city].filter(Boolean).join(' ')
  const categoryText = (shop.shop_categories ?? [])
    .map((c) => c.categories?.name)
    .filter(Boolean)
    .join('・')
  const core = location ? `${shop.name}（${location}）` : shop.name
  const description =
    shop.description?.trim() ||
    `${location ? `${location}の` : ''}${categoryText || 'セレクトショップ'}「${shop.name}」の店舗情報・取り扱いブランド・営業時間をFINDEでチェック。`
  const photo = shop.shop_photos?.[0]?.storage_path
  const image = photo ? shopPhotoUrl(config, photo) : undefined

  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'ClothingStore',
      name: shop.name,
      url: `${SITE.url}${pathname}`,
      ...(image ? { image } : {}),
      ...(shop.description ? { description: shop.description } : {}),
      ...(shop.phone ? { telephone: shop.phone } : {}),
      ...(location || shop.address
        ? {
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'JP',
              ...(shop.areas?.prefecture ? { addressRegion: shop.areas.prefecture } : {}),
              ...(shop.areas?.city ? { addressLocality: shop.areas.city } : {}),
              ...(shop.address ? { streetAddress: shop.address } : {}),
            },
          }
        : {}),
      ...(shop.review_count && shop.review_count > 0 && shop.average_rating != null
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: shop.average_rating,
              reviewCount: shop.review_count,
            },
          }
        : {}),
    },
  ]

  return {
    title: composeTitle(core),
    description: truncate(description),
    canonicalPath: pathname,
    image,
    type: 'website',
    noindex: false,
    jsonLd,
  }
}

interface BrandRow {
  id: string
  name: string
  name_kana: string | null
}

const resolveBrandMeta = async (
  config: SupabaseConfig,
  id: string,
  pathname: string,
): Promise<PageMeta> => {
  const brand = await fetchOne<BrandRow>(
    config,
    `brands?id=eq.${encodeURIComponent(id)}&status=eq.active&select=id,name,name_kana`,
  )

  if (!brand) {
    return { ...defaultMeta(pathname), title: composeTitle('ブランドが見つかりません'), noindex: true }
  }

  const kana = brand.name_kana ? `（${brand.name_kana}）` : ''
  return {
    title: composeTitle(`${brand.name}の取り扱い店舗`),
    description: truncate(
      `${brand.name}${kana}を取り扱うセレクトショップ・古着屋をFINDEで検索。ブランドを扱うお店の一覧と店舗情報をチェックできます。`,
    ),
    canonicalPath: pathname,
    type: 'website',
    noindex: false,
  }
}

interface NewsRow {
  id: string
  title: string
  body: string
}

const resolveNewsMeta = async (
  config: SupabaseConfig,
  id: string,
  pathname: string,
): Promise<PageMeta> => {
  const item = await fetchOne<NewsRow>(
    config,
    `press_releases?id=eq.${encodeURIComponent(id)}&published_at=not.is.null&select=id,title,body`,
  )

  if (!item) {
    return { ...defaultMeta(pathname), title: composeTitle('お知らせが見つかりません'), noindex: true }
  }

  return {
    title: composeTitle(item.title),
    description: truncate(stripMarkdown(item.body)),
    canonicalPath: pathname,
    type: 'article',
    noindex: false,
  }
}

/**
 * リクエストパスから注入すべきページメタを解決する。
 * Supabase 設定が無い場合や未知ルートはサイト既定のメタにフォールバックする。
 */
export const resolvePageMeta = async (
  pathname: string,
  config: SupabaseConfig | null,
): Promise<PageMeta> => {
  // 末尾スラッシュを正規化（"/" は除く）
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  const staticPage = STATIC_PAGES[normalized]
  if (staticPage) {
    return {
      title: composeTitle(staticPage.core),
      description: staticPage.description,
      canonicalPath: normalized,
      type: 'website',
      noindex: false,
    }
  }

  if (config) {
    const shopMatch = normalized.match(/^\/shops\/([^/]+)$/)
    if (shopMatch) return resolveShopMeta(config, shopMatch[1], normalized)

    const brandMatch = normalized.match(/^\/brands\/([^/]+)$/)
    if (brandMatch) return resolveBrandMeta(config, brandMatch[1], normalized)

    const newsMatch = normalized.match(/^\/news\/([^/]+)$/)
    if (newsMatch) return resolveNewsMeta(config, newsMatch[1], normalized)
  }

  return defaultMeta(normalized)
}

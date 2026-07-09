import type { MetaDescriptor } from 'react-router'
import { SITE, toAbsoluteUrl } from '@/config/site'
import type { PageMeta } from './meta'

/**
 * PageMeta を React Router の meta エクスポート形式（MetaDescriptor[]）へ変換する。
 * SSR時は初期HTMLの <head> に、SPA遷移時はクライアントで反映される。
 */
export const pageMetaToDescriptors = (meta: PageMeta): MetaDescriptor[] => {
  const url = toAbsoluteUrl(meta.canonicalPath)
  const image = toAbsoluteUrl(meta.image ?? SITE.defaultImage)

  return [
    { title: meta.title },
    { name: 'description', content: meta.description },
    { tagName: 'link', rel: 'canonical', href: url },
    ...(meta.noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    // Open Graph
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:type', content: meta.type },
    { property: 'og:title', content: meta.title },
    { property: 'og:description', content: meta.description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    // Twitter
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: meta.title },
    { name: 'twitter:description', content: meta.description },
    { name: 'twitter:image', content: image },
    // JSON-LD
    ...(meta.jsonLd ?? []).map((data) => ({ 'script:ld+json': data })),
  ]
}

import { SITE } from '@/config/site'
import { getSupabaseConfig } from '@/lib/seo/config'
import type { SupabaseConfig } from '@/lib/seo/resolve'

/**
 * sitemap.xml を動的生成するリソースルート。
 * ビルド時生成（旧 vite-plugin-sitemap）と異なり、常に最新のDB内容を反映する。
 */

const STATIC_PATHS = [
  '/',
  '/shops',
  '/brands',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
  '/news',
  '/share',
]

const fetchIds = async (config: SupabaseConfig, query: string): Promise<string[]> => {
  try {
    const res = await fetch(`${config.url}/rest/v1/${query}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as { id: string }[]
    return rows.map((row) => row.id)
  } catch {
    return []
  }
}

export const loader = async (): Promise<Response> => {
  const config = getSupabaseConfig()
  let dynamicPaths: string[] = []

  if (config) {
    const [shops, brands, news, shares] = await Promise.all([
      fetchIds(config, 'shops?status=eq.public&select=id'),
      fetchIds(config, 'brands?status=eq.active&select=id'),
      fetchIds(config, 'press_releases?published_at=not.is.null&select=id'),
      fetchIds(config, 'share_posts?visibility=eq.public&state=eq.published&status=eq.published&select=id'),
    ])
    dynamicPaths = [
      ...shops.map((id) => `/shops/${id}`),
      ...brands.map((id) => `/brands/${id}`),
      ...news.map((id) => `/news/${id}`),
      ...shares.map((id) => `/share/${id}`),
    ]
  }

  const urls = [...STATIC_PATHS, ...dynamicPaths]
    .map((path) => `  <url><loc>${SITE.url}${path}</loc></url>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { cloudflare } from '@cloudflare/vite-plugin'
import sitemap from 'vite-plugin-sitemap'

const HOSTNAME = 'https://finde-cloud.com'

const STATIC_ROUTES = [
  '/',
  '/shops',
  '/brands',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
  '/about',
  '/news',
]

async function fetchDynamicRoutes(supabaseUrl: string, supabaseKey: string): Promise<string[]> {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(supabaseUrl, supabaseKey)

  const [shopsRes, brandsRes, newsRes] = await Promise.all([
    client.from('shops').select('id').eq('status', 'public'),
    client.from('brands').select('id').eq('status', 'active'),
    client.from('press_releases').select('id').not('published_at', 'is', null),
  ])

  const shopRoutes = (shopsRes.data ?? []).map((r) => `/shops/${r.id}`)
  const brandRoutes = (brandsRes.data ?? []).map((r) => `/brands/${r.id}`)
  const newsRoutes = (newsRes.data ?? []).map((r) => `/news/${r.id}`)

  return [...shopRoutes, ...brandRoutes, ...newsRoutes]
}

export default defineConfig(async ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY

  let dynamicRoutes: string[] = []

  if (command === 'build' && supabaseUrl && supabaseKey) {
    try {
      dynamicRoutes = await fetchDynamicRoutes(supabaseUrl, supabaseKey)
      console.log(`[sitemap] Dynamic routes: ${dynamicRoutes.length} entries fetched`)
    } catch (err) {
      console.warn('[sitemap] Failed to fetch dynamic routes:', err)
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      cloudflare(),
      sitemap({
        hostname: HOSTNAME,
        dynamicRoutes: [...STATIC_ROUTES, ...dynamicRoutes],
        exclude: ['/auth/*', '/mypage/*', '/admin/*', '/owner/*', '/wishes/*', '/owner-application/*', '/listing-request'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})

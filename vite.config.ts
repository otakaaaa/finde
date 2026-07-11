import { defineConfig } from 'vite'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'

// sitemap.xml は vite-plugin-sitemap ではなく、SSRのリソースルート
// （src/routes/sitemap.ts）で常に最新のDB内容から動的生成する。
export default defineConfig({
  // 通常は未設定（node_modules/.vite）。書き込み制限のある環境でのみ
  // VITE_CACHE_DIR で外部パスへ逃がせるようにする。
  cacheDir: process.env.VITE_CACHE_DIR || undefined,
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

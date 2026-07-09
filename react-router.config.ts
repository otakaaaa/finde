import type { Config } from '@react-router/dev/config'

export default {
  // ルート/ページは src/ 配下に置く（従来構成を維持）
  appDirectory: 'src',
  // ビルド出力先（クライアント: dist/client、サーバー: dist/server）
  buildDirectory: 'dist',
  // 公開ページのSEOのためSSRを有効化（Cloudflare Workers上で実行）
  ssr: true,
  future: {
    // @cloudflare/vite-plugin との連携に必要（Vite Environment API を使用）
    v8_viteEnvironmentApi: true,
  },
} satisfies Config

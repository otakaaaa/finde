import { useState, type ReactNode } from 'react'
import { isRouteErrorResponse, Links, Meta, Scripts, useRouteError } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary as AppErrorBoundary } from '@/components/ErrorBoundary'
import { Layout as SiteLayout } from '@/components/layout/Layout'
import './index.css'

const GA_MEASUREMENT_ID = 'G-3K3T2RHPRD'

const gtagInit = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
`

/**
 * ドキュメントシェル（旧 index.html 相当）。
 * title / meta description は各ルートの meta エクスポート、
 * または各ページの <Seo>（React 19 ネイティブ metadata）が出力する。
 */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#1c1d1f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FINDE" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Google tag (gtag.js) */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: gtagInit }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  // QueryClient はリクエスト（レンダーツリー）ごとに生成し、
  // Workers のアイソレート共有によるリクエスト間のキャッシュ混在を防ぐ。
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  )

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SiteLayout />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}

/** ルートレベルのエラー画面（loader エラー・想定外例外） */
export function ErrorBoundary() {
  const error = useRouteError()
  const is404 = isRouteErrorResponse(error) && error.status === 404

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-2xl font-bold">
        {is404 ? 'ページが見つかりません' : 'エラーが発生しました'}
      </h1>
      <p className="text-sm text-muted-foreground">
        {is404
          ? 'お探しのページは移動または削除された可能性があります。'
          : '時間をおいて再度お試しください。'}
      </p>
      <a href="/" className="text-sm underline underline-offset-4">
        トップへ戻る
      </a>
    </div>
  )
}

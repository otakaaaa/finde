/**
 * Cloudflare Pages Functions ミドルウェア。
 *
 * SPA(クライアントレンダリング)では、配信されるHTMLが空の殻のため、
 * 検索エンジンや SNS の OGP スクレイパー(JS非実行)が各ページのメタを取得できない。
 * ここでは HTML ドキュメントのレスポンスに対し、ルートごとの
 * title / description / canonical / OGP / Twitter / JSON-LD を <head> に注入する。
 *
 * 注入タグには data-seo-ssr 属性を付けており、ブラウザ(JS実行環境)では
 * main.tsx 起動時に除去され、以降は React の <Seo> がメタを管理する。
 */
import { resolvePageMeta, type SupabaseConfig } from '../src/lib/seo/resolve'
import { buildHeadTags } from '../src/lib/seo/meta'

interface Env {
  SUPABASE_URL?: string
  VITE_SUPABASE_URL?: string
  SUPABASE_PUBLISHABLE_KEY?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface PagesContext {
  request: Request
  env: Env
  next: () => Promise<Response>
}

const getSupabaseConfig = (env: Env): SupabaseConfig | null => {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL
  const key = env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  return { url, key }
}

/** <head> の末尾に SSR メタタグを追記する HTMLRewriter ハンドラ */
class HeadInjector {
  constructor(private readonly html: string) {}
  element(element: { append: (content: string, options: { html: boolean }) => void }): void {
    element.append(this.html, { html: true })
  }
}

/**
 * HTML ドキュメントは常に再検証させる。新デプロイ後にユーザーが古い index.html を
 * 握り続けると、ハッシュ名が変わった旧チャンクの取得に失敗する（stale chunk）。
 * no-cache を付けることで、ページ遷移/再訪時に最新の HTML を取得させる。
 * （ハッシュ付き /assets/* は public/_headers 側で immutable に長期キャッシュする）
 */
const withHtmlNoCache = (response: Response): Response => {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-cache, must-revalidate')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const response = await context.next()

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html')) return response

  const url = new URL(context.request.url)

  let headTags: string
  try {
    const meta = await resolvePageMeta(url.pathname, getSupabaseConfig(context.env))
    headTags = buildHeadTags(meta)
  } catch {
    // メタ生成に失敗してもページ配信は止めない
    return withHtmlNoCache(response)
  }

  const transformed = new HTMLRewriter()
    .on('head', new HeadInjector(headTags))
    .transform(response)

  return withHtmlNoCache(transformed)
}

declare const HTMLRewriter: {
  new (): {
    on(selector: string, handler: unknown): {
      transform(response: Response): Response
    }
  }
}

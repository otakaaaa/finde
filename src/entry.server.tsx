import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'

/**
 * Cloudflare Workers（workerd）用のサーバーエントリ。
 * Web Streams ベースの renderToReadableStream でSSRする。
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
): Promise<Response> {
  let shellRendered = false
  const userAgent = request.headers.get('user-agent')

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500
        // シェルレンダリング後のエラーのみログする（シェル前のエラーは reject され
        // ハンドラ側で処理されるため、二重ログを避ける）
        if (shellRendered) {
          console.error(error)
        }
      },
    },
  )
  shellRendered = true

  // 検索エンジンボットにはストリーミングせず、全て描画してから返す（SEO対策）
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}

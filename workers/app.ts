import { createRequestHandler } from 'react-router'

/**
 * Cloudflare Workers エントリポイント。
 * 静的アセット（build/client）は Workers Assets が配信し、
 * それ以外のリクエストを React Router のSSRハンドラへ渡す。
 */

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
)

export default {
  fetch(request: Request): Promise<Response> {
    return requestHandler(request)
  },
}

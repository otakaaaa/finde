import { data } from 'react-router'
import NotFoundPage from '@/pages/NotFoundPage'

/** 未知のURLは404ステータスで返す（SEO上、200を返さない） */
export const loader = () => {
  throw data(null, { status: 404 })
}

/** throw された404はこのルートの ErrorBoundary が受け、デザイン済み404ページを表示する */
export function ErrorBoundary() {
  return <NotFoundPage />
}

export default NotFoundPage

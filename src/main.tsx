import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { reloadOnceForStaleChunk } from '@/lib/chunkReload'

// 新しいデプロイでチャンクのハッシュ名が変わると、古い index.html を握ったセッションは
// 存在しない旧チャンクの取得に失敗する。Vite はその際 `vite:preloadError` を発火するので、
// 一度だけ自動リロードして最新の index.html を取得させ、エラー画面を回避する。
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForStaleChunk()
})

// SSR(Pages Function)が注入したSEOタグを除去する。
// 以降はクライアントの React <Seo> がメタを管理し、SPA遷移でも正しく更新される。
document.querySelectorAll('head [data-seo-ssr]').forEach((el) => el.remove())

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

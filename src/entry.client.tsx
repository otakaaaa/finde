import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'
import { reloadOnceForStaleChunk } from '@/lib/chunkReload'

// 新しいデプロイでチャンクのハッシュ名が変わると、古いHTMLを握ったセッションは
// 存在しない旧チャンクの取得に失敗する。Vite はその際 `vite:preloadError` を発火するので、
// 一度だけ自動リロードして最新のHTMLを取得させ、エラー画面を回避する。
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForStaleChunk()
})

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  )
})

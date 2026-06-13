import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

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

import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { isChunkLoadError, reloadOnceForStaleChunk } from '@/lib/chunkReload'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // 旧チャンクの取得失敗（新デプロイ後の stale chunk）は、最新の index.html を
    // 取得し直せば解消する。`vite:preloadError` を取りこぼした場合のフォールバックとして、
    // ここでも一度だけ自動リロードを試みる。
    if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
      return
    }
    console.error('[ErrorBoundary]', error, info)
  }

  override render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          padding: '40px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ backgroundColor: '#1a1a1a', padding: '32px 40px' }}>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.5em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              FINDE
            </p>
          </div>

          <div style={{ padding: '48px 40px 40px' }}>
            <h1
              style={{
                margin: '0 0 8px',
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#1a1a1a',
              }}
            >
              エラーが発生しました。
            </h1>
            <p
              style={{
                margin: '0 0 32px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.25)',
              }}
            >
              Something went wrong
            </p>

            <p
              style={{
                margin: '0 0 32px',
                fontSize: '14px',
                lineHeight: 1.8,
                color: '#444444',
              }}
            >
              予期しないエラーが発生しました。<br />
              ページを再読み込みするか、トップページに戻ってください。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px 40px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                ページを再読み込み
              </button>
              <a
                href="/"
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#1a1a1a',
                  border: '1px solid #e0e0e0',
                  padding: '16px 40px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
              >
                トップページへ
              </a>
            </div>
          </div>

          <div style={{ padding: '0 40px' }}>
            <div style={{ borderTop: '1px solid #eeeeee' }} />
          </div>

          <div style={{ padding: '24px 40px 32px' }}>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.7, color: '#bbbbbb' }}>
              問題が続く場合はお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    )
  }
}

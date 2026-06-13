// 新しいデプロイでハッシュ付きチャンクのファイル名が変わると、古いタブ/キャッシュを
// 握ったセッションは存在しない旧チャンクを取りにいき「Failed to fetch dynamically
// imported module」で失敗する。その場合に一度だけ自動リロードして最新の index.html を
// 取得させ、ユーザーにエラー画面を見せずに復帰させるためのユーティリティ。

const RELOAD_FLAG_KEY = 'chunk-reload-attempted'

/**
 * 動的 import（コード分割チャンク）の読み込み失敗エラーかどうかを判定する。
 */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Importing a module script failed')
  )
}

/**
 * 一度だけページをリロードする。リロードは新しい index.html を取得して旧チャンク参照を
 * 解消するためのもの。直前にリロード済み（フラグあり）の場合は、本当に壊れたデプロイで
 * 無限リロードに陥らないよう false を返して何もしない。
 *
 * フラグはセッション単位で保持する（mount 時にクリアしない）。これにより、リロード後も
 * なお同じチャンク取得に失敗するケースでは ErrorBoundary 側で通常のエラー画面を表示する。
 */
export function reloadOnceForStaleChunk(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG_KEY)) {
      return false
    }
    sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
  } catch {
    // sessionStorage が使えない環境では多重リロードのリスクを避けるため何もしない。
    return false
  }

  window.location.reload()
  return true
}

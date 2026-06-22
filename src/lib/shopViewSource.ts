export type ShopViewSource = 'search' | 'area' | 'share' | 'brand' | 'direct'

const VALID_SOURCES: ShopViewSource[] = ['search', 'area', 'share', 'brand', 'direct']

const isValidSource = (value: unknown): value is ShopViewSource =>
  typeof value === 'string' && (VALID_SOURCES as string[]).includes(value)

/**
 * 流入元を判定する（案C: 簡易ハイブリッド）。
 * 1. react-router の location.state.source が明示されていればそれを優先（サイト内遷移）。
 * 2. なければ document.referrer のパスから推定。
 * 3. 判定できなければ 'direct'。
 *
 * 完全な精度は出ない（取りこぼしは direct に分類される）。
 */
export const resolveShopViewSource = (locationState?: unknown): ShopViewSource => {
  // 1. 明示的な location.state.source
  if (locationState && typeof locationState === 'object' && 'source' in locationState) {
    const candidate = (locationState as { source?: unknown }).source
    if (isValidSource(candidate)) return candidate
  }

  // 2. referrer ベースの推定（同一オリジンのみ）
  try {
    const referrer = document.referrer
    if (referrer) {
      const ref = new URL(referrer)
      if (ref.origin === window.location.origin) {
        const path = ref.pathname
        if (path.startsWith('/shops')) return 'search'
        if (path.startsWith('/brands')) return 'brand'
        if (path.startsWith('/share')) return 'share'
      }
    }
  } catch {
    // URL パース失敗時は direct 扱い
  }

  // 3. デフォルト
  return 'direct'
}

const STORAGE_KEY = 'finde_visitor_id'

/**
 * 匿名訪問者を識別する擬似ID（ランダムUUID）を返す。
 * localStorage に永続化し、なければ発行する。個人を特定しない。
 * localStorage が使えない環境ではセッション限りのIDを返す。
 */
export const getVisitorId = (): string => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // プライベートブラウジング等で localStorage 不可の場合
    return crypto.randomUUID()
  }
}

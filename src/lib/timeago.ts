/**
 * 日本語の相対時刻文字列を返す
 * 例: "たった今" / "3分前" / "2時間前" / "5日前" / "03/28"
 */
export function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60_000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`

  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
  })
}

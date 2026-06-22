import type { ShopBanner, BannerPlacement } from '@/types'

// 表示位置の選択肢とラベル
export const BANNER_PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'shop_detail', label: '店舗詳細ページ上部' },
  { value: 'favorite_button', label: 'お気に入りボタンの上' },
]

export const bannerPlacementLabel = (placement: BannerPlacement): string =>
  BANNER_PLACEMENTS.find((p) => p.value === placement)?.label ?? placement

// バナーが指定の表示位置を含むか
export const hasBannerPlacement = (banner: ShopBanner, placement: BannerPlacement): boolean =>
  banner.placements.includes(placement)

// 掲載中（is_active かつ 期間内）かどうかを判定する。
// オーナー/管理者は RLS 上すべてのバナーを取得できるため、表示側でも絞り込む。
export const isBannerLive = (banner: ShopBanner, now: number = Date.now()): boolean => {
  if (!banner.isActive) return false
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return false
  if (banner.endsAt && new Date(banner.endsAt).getTime() < now) return false
  return true
}

// 掲載期間を人間向けの文字列に整形する。
export const formatBannerPeriod = (banner: ShopBanner): string => {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' }) : ''
  const start = fmt(banner.startsAt)
  const end = fmt(banner.endsAt)
  if (!start && !end) return '常時掲載'
  return `${start || '即時'} 〜 ${end || '無期限'}`
}

// ISO文字列を datetime-local 入力値（ローカル時刻）へ変換する。
export const toLocalDatetimeInput = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 入力フォームの空文字を null に正規化する。
export const toNullableInput = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

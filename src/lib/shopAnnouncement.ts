import type { ShopAnnouncement } from '@/types'

// 掲載中（is_active かつ 期間内）かどうかを判定する。
// オーナー/管理者は RLS 上すべてのお知らせを取得できるため、表示側でも絞り込む。
export const isAnnouncementLive = (
  announcement: ShopAnnouncement,
  now: number = Date.now(),
): boolean => {
  if (!announcement.isActive) return false
  if (announcement.startsAt && new Date(announcement.startsAt).getTime() > now) return false
  if (announcement.endsAt && new Date(announcement.endsAt).getTime() < now) return false
  return true
}

// 掲載期間を人間向けの文字列に整形する。
export const formatAnnouncementPeriod = (announcement: ShopAnnouncement): string => {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' }) : ''
  const start = fmt(announcement.startsAt)
  const end = fmt(announcement.endsAt)
  if (!start && !end) return '常時掲載'
  return `${start || '即時'} 〜 ${end || '無期限'}`
}

// 公開日として表示する日付（starts_at, なければ created_at）を整形する。
export const formatAnnouncementDate = (announcement: ShopAnnouncement): string => {
  const iso = announcement.startsAt ?? announcement.createdAt
  return new Date(iso).toLocaleDateString('ja-JP', { dateStyle: 'medium' })
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

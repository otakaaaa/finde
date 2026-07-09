import type { SupabaseConfig } from './resolve'

/**
 * SEOメタ解決用の Supabase 接続設定。
 * VITE_* 変数はビルド時にクライアント/SSR両バンドルへインライン化される
 * （publishable key のため秘匿不要）。
 */
export const getSupabaseConfig = (): SupabaseConfig | null => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  if (!url || !key) return null
  return { url, key }
}

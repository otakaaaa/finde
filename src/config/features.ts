/**
 * Feature flags
 *
 * OWNER_FEATURE_ENABLED:
 *   false = オーナー機能を無効化（MVP除外）。ソースコードは保持。
 *   true  = オーナー機能を有効化。
 *
 * WISH_FEATURE_ENABLED:
 *   false = ウィッシュ機能を無効化（MVP除外）。ソースコードは保持。
 *   true  = ウィッシュ機能を有効化。
 *
 * MAINTENANCE_MODE:
 *   env: VITE_MAINTENANCE_MODE=true でメンテナンスモードを有効化。
 *   admin ロールのユーザーはメンテナンス中でも通常利用可能。
 *
 * MAINTENANCE_UNTIL:
 *   env: VITE_MAINTENANCE_UNTIL="2026年6月10日 18:00ごろ" で解除見込み日時を設定。
 *   任意の文字列で指定。未設定の場合は「未定」と表示。
 */
export const OWNER_FEATURE_ENABLED = false
export const WISH_FEATURE_ENABLED = true
export const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'
export const MAINTENANCE_UNTIL: string | null = import.meta.env.VITE_MAINTENANCE_UNTIL ?? null

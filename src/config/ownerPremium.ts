/**
 * オーナー向け有料機能（プレミアム）の定義
 *
 * 一部のオーナー機能を有料プラン限定にできるようにするための定義。
 * ただし課金導線（決済）は未実装のため、現時点では全機能を無料で開放する。
 *
 * OWNER_PREMIUM_ENABLED:
 *   true  = 有料機能のゲーティングを有効化（無料オーナーはロック画面を表示）。
 *   false = ゲーティングを無効化（全オーナーが利用可能）。課金を開始するまでは
 *           false にして全機能を無料で開放する。
 */
export const OWNER_PREMIUM_ENABLED = false

/**
 * オーナー向け有料プランの名称。
 * 消費者向けの「プレミアム会員」と区別するため「オーナープレミアム」とする。
 */
export const OWNER_PREMIUM_PLAN_NAME = 'オーナープレミアム'

export type OwnerPremiumFeature = 'wish-analytics' | 'analytics' | 'announcements'

export interface OwnerPremiumFeatureMeta {
  /** ロック画面に表示する機能名 */
  label: string
  /** ロック画面に表示する機能の説明 */
  description: string
}

/**
 * 有料プラン限定のオーナー機能一覧。
 * ここに含まれない機能（店舗編集・ブランド管理・アイテム管理）は無料で利用可能。
 */
export const OWNER_PREMIUM_FEATURES: Record<OwnerPremiumFeature, OwnerPremiumFeatureMeta> = {
  'wish-analytics': {
    label: 'ウィッシュ分析',
    description: '同エリアのウィッシュ需要を分析してマッチング精度を高めます。',
  },
  analytics: {
    label: 'アクセス解析',
    description: '店舗詳細の閲覧数(PV/UU)・流入元・人気アイテムを確認できます。',
  },
  announcements: {
    label: 'お知らせ管理',
    description: '店舗詳細ページに表示するお知らせを登録・掲載できます。',
  },
}

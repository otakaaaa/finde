import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getVisitorId } from '@/lib/visitorId'
import type { ShopViewSource } from '@/lib/shopViewSource'

export type ShopActionType = 'phone' | 'website' | 'instagram' | 'x' | 'tiktok'

/**
 * fire-and-forget でイベントを記録する（失敗は無視）。
 * supabase-js のクエリビルダーは遅延実行のため、.then() を呼んで実際に送信する。
 */
const recordEvent = (
  shopId: string,
  eventType: 'view' | 'item_view' | 'action',
  options?: { source?: ShopViewSource; targetId?: string },
) => {
  if (!shopId) return
  void supabase
    .rpc('record_shop_event', {
      p_shop_id: shopId,
      p_visitor_id: getVisitorId(),
      p_event_type: eventType,
      p_source: options?.source ?? null,
      p_target_id: options?.targetId ?? null,
    } as never)
    .then(undefined, () => {
      // 失敗は無視（fire-and-forget）
    })
}

/**
 * 店舗詳細ページの閲覧(PV)をマウント時に1回記録する。
 * 同一セッション内の同一店舗は二重記録しない（サーバ側は distinct で UU を担保）。
 */
export const useRecordShopView = (shopId: string, source: ShopViewSource) => {
  const recordedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!shopId) return
    if (recordedRef.current.has(shopId)) return
    recordedRef.current.add(shopId)
    recordEvent(shopId, 'view', { source })
  }, [shopId, source])
}

/** アイテム詳細ページの閲覧をマウント時に1回記録する。 */
export const useRecordShopItemView = (shopId: string, itemId: string) => {
  const recordedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!shopId || !itemId) return
    if (recordedRef.current.has(itemId)) return
    recordedRef.current.add(itemId)
    recordEvent(shopId, 'item_view', { targetId: itemId })
  }, [shopId, itemId])
}

/** 外部リンククリック等のアクションを記録するコールバックを返す。 */
export const useRecordShopAction = (shopId: string) =>
  useCallback(
    (type: ShopActionType) => {
      recordEvent(shopId, 'action', { targetId: type })
    },
    [shopId],
  )

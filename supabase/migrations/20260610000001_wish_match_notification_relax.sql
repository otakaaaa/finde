-- =============================================================
-- ウィッシュマッチ通知 条件緩和
--
-- 変更点:
--   - エリア条件: area_id 完全一致 → 都道府県一致（prefecture）
--   - 価格帯条件: price_range_id 完全一致 → min/max 範囲オーバーラップ
--   - バグ修正: w.status = 'active' フィルタ追加
--   - 重複防止: 24時間 → 7日間
--   - メタデータ: shop_id に加えて wish_id を保存
--   - メール通知: notify_email = true のユーザーに Edge Function 経由でメール送信
-- =============================================================

-- ── pg_net 有効化（メール Edge Function の呼び出しに使用） ──────
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── notify_on_shop_becomes_public() を更新 ─────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_shop_becomes_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_shop_id        uuid;
  v_shop_pref      text;
  v_shop_price_min int;
  v_shop_price_max int;
  v_inserted_count int;
BEGIN
  -- INSERT で public、または UPDATE で non-public → public の場合のみ処理
  IF NOT (
    (TG_OP = 'INSERT' AND new.status = 'public')
    OR (TG_OP = 'UPDATE' AND (old.status IS DISTINCT FROM 'public') AND new.status = 'public')
  ) THEN
    RETURN new;
  END IF;

  -- エリアまたは価格帯が未設定の場合はスキップ
  IF new.area_id IS NULL OR new.price_range_id IS NULL THEN
    RETURN new;
  END IF;

  v_shop_id := new.id;

  -- 店舗の都道府県を取得
  SELECT prefecture INTO v_shop_pref
  FROM public.areas
  WHERE id = new.area_id;

  -- 店舗の価格帯の min/max を取得
  SELECT min_price, max_price INTO v_shop_price_min, v_shop_price_max
  FROM public.price_ranges
  WHERE id = new.price_range_id;

  -- マッチするウィッシュを持つユーザーへ通知を送る
  WITH matching_wishes AS (
    SELECT DISTINCT
      w.user_id,
      w.id AS wish_id
    FROM public.wishes w
    -- カテゴリ一致
    JOIN public.shop_categories sc
      ON sc.shop_id = v_shop_id
     AND sc.category_id = w.category_id
    -- 都道府県一致（緩和: area_id 完全一致 → prefecture）
    JOIN public.areas wa
      ON wa.id = w.area_id
     AND wa.prefecture = v_shop_pref
    -- 価格帯オーバーラップ（緩和: ID完全一致 → 範囲比較）
    JOIN public.price_ranges wpr
      ON wpr.id = w.price_range_id
     AND COALESCE(wpr.min_price, 0)          <= COALESCE(v_shop_price_max, 2147483647)
     AND COALESCE(wpr.max_price, 2147483647) >= COALESCE(v_shop_price_min, 0)
    WHERE w.status = 'active'
      -- 店舗の登録者自身には送らない
      AND w.user_id IS DISTINCT FROM new.created_by
    LIMIT 200
  )
  INSERT INTO public.notifications (user_id, type, title, body, link_url, metadata)
  SELECT
    mw.user_id,
    'wish_match',
    'ウィッシュにマッチする店舗が見つかりました',
    new.name || ' がウィッシュリストにマッチしています',
    '/shops/' || v_shop_id::text,
    jsonb_build_object('shop_id', v_shop_id, 'wish_id', mw.wish_id)
  FROM matching_wishes mw
  -- 同一ユーザー × 同一店舗 × 7日以内の重複通知を防止
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.notifications n
    WHERE n.user_id = mw.user_id
      AND n.type = 'wish_match'
      AND n.metadata->>'shop_id' = v_shop_id::text
      AND n.created_at > now() - interval '7 days'
  );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  -- マッチした通知が1件以上ある場合、メール通知 Edge Function を非同期で呼び出す
  -- 前提: app.settings.supabase_url / app.settings.service_role_key が設定済みであること
  --   SET app.settings.supabase_url = 'https://xxx.supabase.co';
  --   SET app.settings.service_role_key = 'eyJ...';
  IF v_inserted_count > 0 THEN
    PERFORM net.http_post(
      url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-wish-match-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body    := jsonb_build_object('shop_id', v_shop_id)
    );
  END IF;

  RETURN new;
END;
$$;

-- トリガー自体は既存のものをそのまま使用（関数の置き換えのみ）

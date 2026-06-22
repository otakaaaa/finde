-- =============================================================
-- ウィッシュマッチ条件を「アイテムカテゴリ一致」に変更 & category_id 削除
--
-- 変更点:
--   - 通知トリガーの条件①: 店舗ジャンルカテゴリ一致（shop_categories）
--     → 店舗のアイテムカテゴリ ⊇ ウィッシュの item_category_id
--       （shop_item_types → item_types.item_category_id）
--   - ウィッシュの item_category_id が NULL の場合はアイテムカテゴリ条件を
--     スキップ（都道府県＋価格帯のみでマッチ）
--   - 不要になった wishes.category_id カラムを削除
-- =============================================================

-- ── notify_on_shop_becomes_public() を更新 ─────────────────────
create or replace function public.notify_on_shop_becomes_public()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id        uuid;
  v_shop_pref_id   smallint;
  v_shop_price_min int;
  v_shop_price_max int;
  v_inserted_count int;
begin
  if not (
    (tg_op = 'INSERT' and new.status = 'public')
    or (tg_op = 'UPDATE' and (old.status is distinct from 'public') and new.status = 'public')
  ) then
    return new;
  end if;

  if new.prefecture_id is null or new.price_range_id is null then
    return new;
  end if;

  v_shop_id      := new.id;
  v_shop_pref_id := new.prefecture_id;

  select min_price, max_price into v_shop_price_min, v_shop_price_max
  from public.price_ranges
  where id = new.price_range_id;

  with matching_wishes as (
    select distinct
      w.user_id,
      w.id as wish_id
    from public.wishes w
    -- 価格帯オーバーラップ
    join public.price_ranges wpr
      on wpr.id = w.price_range_id
     and coalesce(wpr.min_price, 0)          <= coalesce(v_shop_price_max, 2147483647)
     and coalesce(wpr.max_price, 2147483647) >= coalesce(v_shop_price_min, 0)
    where w.status = 'active'
      -- 都道府県一致
      and w.prefecture_id = v_shop_pref_id
      -- アイテムカテゴリ一致（NULL の場合は条件スキップ）
      and (
        w.item_category_id is null
        or exists (
          select 1
          from public.shop_item_types sit
          join public.item_types it on it.id = sit.item_type_id
          where sit.shop_id = v_shop_id
            and it.item_category_id = w.item_category_id
        )
      )
      -- 店舗の登録者自身には送らない
      and w.user_id is distinct from new.created_by
    limit 200
  )
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select
    mw.user_id,
    'wish_match',
    'ウィッシュにマッチする店舗が見つかりました',
    new.name || ' がウィッシュリストにマッチしています',
    '/shops/' || v_shop_id::text,
    jsonb_build_object('shop_id', v_shop_id, 'wish_id', mw.wish_id)
  from matching_wishes mw
  where not exists (
    select 1
    from public.notifications n
    where n.user_id = mw.user_id
      and n.type = 'wish_match'
      and n.metadata->>'shop_id' = v_shop_id::text
      and n.created_at > now() - interval '7 days'
  );

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count > 0 then
    perform net.http_post(
      url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-wish-match-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body    := jsonb_build_object('shop_id', v_shop_id)
    );
  end if;

  return new;
end;
$$;

-- ── 不要になった category_id カラムを削除 ──────────────────────
alter table public.wishes
  drop column category_id;

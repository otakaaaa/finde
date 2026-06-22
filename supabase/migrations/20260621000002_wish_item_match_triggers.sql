-- =============================================================
-- ウィッシュ × 在庫アイテム マッチング通知
--
-- マッチ対象を「店舗」から「在庫アイテム（shop_items）」へ変更。
-- アイテム1件に対しマッチするウィッシュを検索し通知する共通関数を作り、
--   A) アイテム登録／公開時（shop_items トリガー）
--   B) 店舗公開時（既存アイテム分をループ）
-- の2イベントから呼び出す。
--
-- マッチ条件（すべて AND・厳格）:
--   1. 店舗 public ＆ アイテム is_available
--   2. 都道府県一致（shop.prefecture_id = wish.prefecture_id）
--   3. 種別: wish.item_type_id があれば型一致 / なければ item_category_id でカテゴリ一致 / 両 null は無制限
--   4. ブランド: wish.brand_id があれば一致必須
--   5. サイズ: wish.size_id があれば item.size_ids に含む
--   6. 価格: item.price があれば wish の価格帯内（item.price=null はスキップ）
--   7. wish.status = 'active'
--   8. 自店除外（wish.user_id <> shop.created_by）
--
-- 重複防止: notifications.metadata.item_id × user × 7日
-- =============================================================

-- ── 共通: アイテム1件に対するマッチ通知 ──────────────────────────
create or replace function public.notify_wishes_for_shop_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id          uuid;
  v_shop_pref_id     smallint;
  v_shop_status      text;
  v_shop_created_by  uuid;
  v_shop_name        text;
  v_is_available     boolean;
  v_item_type_id     int;
  v_item_category_id int;
  v_brand_id         uuid;
  v_size_ids         int[];
  v_price            int;
  v_inserted_count   int;
  v_email_count      int;
begin
  -- アイテム＋店舗＋アイテムタイプのカテゴリを取得
  select
    si.shop_id, si.is_available, si.item_type_id, si.brand_id, si.size_ids, si.price,
    it.item_category_id,
    s.prefecture_id, s.status, s.created_by, s.name
  into
    v_shop_id, v_is_available, v_item_type_id, v_brand_id, v_size_ids, v_price,
    v_item_category_id,
    v_shop_pref_id, v_shop_status, v_shop_created_by, v_shop_name
  from public.shop_items si
  join public.shops s on s.id = si.shop_id
  left join public.item_types it on it.id = si.item_type_id
  where si.id = p_item_id;

  -- 店舗が非公開・アイテム非公開・都道府県未設定ならスキップ
  if v_shop_id is null
     or v_shop_status <> 'public'
     or v_is_available is not true
     or v_shop_pref_id is null then
    return;
  end if;

  -- マッチするウィッシュへアプリ内通知を作成（重複防止つき）
  with matching_wishes as (
    select w.user_id, w.id as wish_id
    from public.wishes w
    where w.status = 'active'
      -- 都道府県
      and w.prefecture_id = v_shop_pref_id
      -- 種別
      and (
        (w.item_type_id is not null and w.item_type_id = v_item_type_id)
        or (w.item_type_id is null and w.item_category_id is not null and w.item_category_id = v_item_category_id)
        or (w.item_type_id is null and w.item_category_id is null)
      )
      -- ブランド
      and (w.brand_id is null or w.brand_id = v_brand_id)
      -- サイズ
      and (w.size_id is null or w.size_id = any(v_size_ids))
      -- 価格
      and (
        v_price is null
        or exists (
          select 1 from public.price_ranges pr
          where pr.id = w.price_range_id
            and coalesce(pr.min_price, 0)          <= v_price
            and coalesce(pr.max_price, 2147483647) >= v_price
        )
      )
      -- 自店除外
      and w.user_id is distinct from v_shop_created_by
    limit 500
  ),
  inserted as (
    insert into public.notifications (user_id, type, title, body, link_url, metadata)
    select
      mw.user_id,
      'wish_match',
      'ウィッシュにマッチするアイテムが見つかりました',
      v_shop_name || ' に「' || (select name from public.shop_items where id = p_item_id) || '」が登録されました',
      '/shops/' || v_shop_id::text || '/items/' || p_item_id::text,
      jsonb_build_object('shop_id', v_shop_id, 'item_id', p_item_id, 'wish_id', mw.wish_id)
    from matching_wishes mw
    where not exists (
      select 1 from public.notifications n
      where n.user_id = mw.user_id
        and n.type = 'wish_match'
        and n.metadata->>'item_id' = p_item_id::text
        and n.created_at > now() - interval '7 days'
    )
    returning 1
  )
  select count(*) into v_inserted_count from inserted;

  -- 新規通知が無ければメールも送らない（二重発火を抑止）
  if v_inserted_count = 0 then
    return;
  end if;

  -- メール通知対象（notify_email = true）が存在する場合のみ Edge Function を呼ぶ
  select count(*) into v_email_count
  from public.wishes w
  where w.status = 'active'
    and w.notify_email = true
    and w.prefecture_id = v_shop_pref_id
    and (
      (w.item_type_id is not null and w.item_type_id = v_item_type_id)
      or (w.item_type_id is null and w.item_category_id is not null and w.item_category_id = v_item_category_id)
      or (w.item_type_id is null and w.item_category_id is null)
    )
    and (w.brand_id is null or w.brand_id = v_brand_id)
    and (w.size_id is null or w.size_id = any(v_size_ids))
    and (
      v_price is null
      or exists (
        select 1 from public.price_ranges pr
        where pr.id = w.price_range_id
          and coalesce(pr.min_price, 0)          <= v_price
          and coalesce(pr.max_price, 2147483647) >= v_price
      )
    )
    and w.user_id is distinct from v_shop_created_by;

  if v_email_count > 0 then
    perform net.http_post(
      url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-wish-match-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body    := jsonb_build_object('item_id', p_item_id)
    );
  end if;
end;
$$;

-- ── イベントA: アイテム登録／公開 ──────────────────────────────
create or replace function public.on_shop_item_available()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_available is true then
    perform public.notify_wishes_for_shop_item(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists shop_items_notify_wish_match on public.shop_items;
create trigger shop_items_notify_wish_match
  after insert or update of is_available, item_type_id, brand_id, price, size_ids
  on public.shop_items
  for each row execute function public.on_shop_item_available();

-- ── イベントB: 店舗公開（既存アイテム分をループ） ────────────────
create or replace function public.notify_on_shop_becomes_public()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
begin
  if not (
    (tg_op = 'INSERT' and new.status = 'public')
    or (tg_op = 'UPDATE' and (old.status is distinct from 'public') and new.status = 'public')
  ) then
    return new;
  end if;

  for v_item in
    select id from public.shop_items
    where shop_id = new.id and is_available = true
  loop
    perform public.notify_wishes_for_shop_item(v_item.id);
  end loop;

  return new;
end;
$$;

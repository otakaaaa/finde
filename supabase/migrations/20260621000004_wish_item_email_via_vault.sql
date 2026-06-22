-- =============================================================
-- ウィッシュマッチ メール呼び出しを app.settings → Supabase Vault に移行
--
-- セキュリティ向上のため、service_role_key / project_url を
-- 平文の GUC（app.settings.*）ではなく暗号化された Vault から読む。
--   - vault.decrypted_secrets を読めるのは本関数（SECURITY DEFINER, postgres所有）のみ
--   - シークレットの実値はマイグレーションに含めない（環境ごとに手動投入）
--     登録名: 'project_url' / 'service_role_key'
--
-- ※ 実値の投入は supabase/scripts/set-vault-secrets.example.sql 参照
-- =============================================================

-- Vault 拡張（Supabase クラウドでは導入済み・ローカル用に冪等で確保）
create extension if not exists supabase_vault with schema vault cascade;

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
  v_supabase_url     text;
  v_service_key      text;
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

  -- メール通知対象（notify_email = true）が存在するか
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

  if v_email_count = 0 then
    return;
  end if;

  -- Vault からシークレットを取得（本関数のみ復号可能）
  select decrypted_secret into v_supabase_url
  from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets where name = 'service_role_key' limit 1;

  -- 未設定環境では安全にスキップ（アプリ内通知は作成済み）
  if v_supabase_url is null or v_service_key is null then
    return;
  end if;

  perform net.http_post(
    url     := v_supabase_url || '/functions/v1/send-wish-match-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := jsonb_build_object('item_id', p_item_id)
  );
end;
$$;

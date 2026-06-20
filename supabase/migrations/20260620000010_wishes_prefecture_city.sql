-- =============================================================
-- wishes.area_id を prefecture_id + city_id に分割
--
-- areas テキストベーステーブルから prefectures / cities の
-- 正規化 FK に移行。エリア選択を都道府県・市区町村の 2 段階にする。
-- 合わせて get_wish_recommendations RPC と
-- notify_on_shop_becomes_public トリガーを更新。
-- =============================================================

-- 1. カラム追加（nullable で追加してからバックフィル）
alter table public.wishes
  add column prefecture_id smallint references public.prefectures(id),
  add column city_id       int       references public.cities(id);

-- 2. 既存データを area_id → prefectures / cities に変換
update public.wishes w
set
  prefecture_id = (
    select p.id
    from public.areas a
    join public.prefectures p on p.name = a.prefecture
    where a.id = w.area_id
    limit 1
  ),
  city_id = (
    select c.id
    from public.areas a
    join public.prefectures p on p.name = a.prefecture
    join public.cities c      on c.name = a.city and c.prefecture_id = p.id
    where a.id = w.area_id
    limit 1
  );

-- 3. prefecture_id / city_id を NOT NULL に変更
alter table public.wishes
  alter column prefecture_id set not null,
  alter column city_id       set not null;

-- 4. area_id カラムを削除
alter table public.wishes
  drop column area_id;

-- =============================================================
-- get_wish_recommendations: area_id → prefecture_id / city_id
-- =============================================================
create or replace function public.get_wish_recommendations(
  p_prefecture_id    smallint,
  p_city_id          int      default null,
  p_item_type_id     int      default null,
  p_item_category_id int      default null,
  p_brand_id         uuid     default null,
  p_price_range_id   int      default null
)
returns table (shop_id uuid, score int)
language sql stable
set search_path = ''
as $$
  with
  item_type_shops as (
    select sit.shop_id
    from public.shop_item_types sit
    where p_item_type_id is not null
      and sit.item_type_id = p_item_type_id
  ),
  item_category_shops as (
    select sit.shop_id
    from public.shop_item_types sit
    join public.item_types it on it.id = sit.item_type_id
    where p_item_category_id is not null
      and it.item_category_id = p_item_category_id
  ),
  brand_shops as (
    select sb.shop_id
    from public.shop_brands sb
    where p_brand_id is not null
      and sb.brand_id = p_brand_id
  )
  select
    s.id as shop_id,
    (
      case when exists (select 1 from item_type_shops     where shop_id = s.id) then 3 else 0 end +
      case when exists (select 1 from brand_shops         where shop_id = s.id) then 3 else 0 end +
      case when exists (select 1 from item_category_shops where shop_id = s.id) then 2 else 0 end +
      case when s.price_range_id = p_price_range_id                             then 2 else 0 end +
      case when s.city_id = p_city_id                                           then 1 else 0 end
    ) as score
  from public.shops s
  where s.status = 'public'
    and s.prefecture_id = p_prefecture_id
  order by score desc
  limit 20;
$$;

-- =============================================================
-- notify_on_shop_becomes_public: area_id → prefecture_id
-- =============================================================
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
    join public.shop_categories sc
      on sc.shop_id = v_shop_id
     and sc.category_id = w.category_id
    join public.price_ranges wpr
      on wpr.id = w.price_range_id
     and coalesce(wpr.min_price, 0)          <= coalesce(v_shop_price_max, 2147483647)
     and coalesce(wpr.max_price, 2147483647) >= coalesce(v_shop_price_min, 0)
    where w.status = 'active'
      and w.prefecture_id = v_shop_pref_id
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

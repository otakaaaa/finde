-- お気に入り(favorites)を店舗フォロー(shop_follows)へ全面リネームする。
-- データは alter table rename でそのまま引き継ぐ（無停止）。
-- 参照: docs/design/shop-follow.md

-- 1. テーブル・カラムのリネーム
alter table public.favorites rename to shop_follows;
alter table public.shops rename column favorite_count to follower_count;

-- 2. 制約・索引のリネーム（rename で自動追従しない名称を揃える）
alter table public.shop_follows
  rename constraint favorites_pkey to shop_follows_pkey;
alter table public.shop_follows
  rename constraint favorites_user_id_shop_id_key to shop_follows_user_id_shop_id_key;
alter table public.shop_follows
  rename constraint favorites_user_id_fkey to shop_follows_user_id_fkey;
alter table public.shop_follows
  rename constraint favorites_shop_id_fkey to shop_follows_shop_id_fkey;

-- 3. フォロワー数集計トリガーを新名称で再作成
drop trigger if exists on_favorite_change on public.shop_follows;
drop function if exists public.update_shop_favorite_count();

create or replace function public.update_shop_follower_count()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.shops
  set follower_count = (
    select count(*) from public.shop_follows
    where shop_id = coalesce(new.shop_id, old.shop_id)
  )
  where id = coalesce(new.shop_id, old.shop_id);
  return coalesce(new, old);
end;
$$;

create trigger on_shop_follow_change
  after insert or delete on public.shop_follows
  for each row execute function public.update_shop_follower_count();

-- 4. RLS ポリシーを新名称で再作成（内容は現行と同一: 本人のみ参照・作成・削除）
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'shop_follows'
  loop
    execute format('drop policy %I on public.shop_follows', pol.policyname);
  end loop;
end;
$$;

create policy shop_follows_select_own on public.shop_follows
  for select using (auth.uid() = user_id);
create policy shop_follows_insert_own on public.shop_follows
  for insert with check (auth.uid() = user_id);
create policy shop_follows_delete_own on public.shop_follows
  for delete using (auth.uid() = user_id);

-- 5. favorites を参照していた既存関数を shop_follows 参照で再作成
--    （JSONキーも 'favorites' → 'follows' に変更。過去スナップショットの
--      'favorites' キーはフロント側でフォールバック読み取りする）

create or replace function public.compute_analytics_for_date(p_date date)
returns jsonb
language sql security definer set search_path = ''
as $$
  select jsonb_build_object(
    'users',    (
      select count(*) from public.users
      where (created_at at time zone 'Asia/Tokyo')::date = p_date
    ),
    'shops',    (
      select count(*) from public.shops
      where (created_at at time zone 'Asia/Tokyo')::date = p_date
        and status = 'public'
    ),
    'listing_requests', jsonb_build_object(
      'pending',  (
        select count(*) from public.shop_listing_requests
        where (created_at at time zone 'Asia/Tokyo')::date = p_date
          and status = 'pending'
      ),
      'approved', (
        select count(*) from public.shop_listing_requests
        where (created_at at time zone 'Asia/Tokyo')::date = p_date
          and status = 'approved'
      ),
      'rejected', (
        select count(*) from public.shop_listing_requests
        where (created_at at time zone 'Asia/Tokyo')::date = p_date
          and status = 'rejected'
      )
    ),
    'follows', (
      select count(*) from public.shop_follows
      where (created_at at time zone 'Asia/Tokyo')::date = p_date
    ),
    'wishes',    (
      select count(*) from public.wishes
      where (created_at at time zone 'Asia/Tokyo')::date = p_date
    ),
    'subscriptions', jsonb_build_object(
      'new',      (
        select count(*) from public.subscriptions
        where (created_at at time zone 'Asia/Tokyo')::date = p_date
          and status = 'active'
      ),
      'canceled', (
        select count(*) from public.subscriptions
        where canceled_at is not null
          and (canceled_at at time zone 'Asia/Tokyo')::date = p_date
      )
    )
  );
$$;

create or replace function public.get_shop_view_analytics(
  p_shop_id uuid,
  p_days    int default 30
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_days      int  := greatest(1, least(coalesce(p_days, 30), 365));
  v_to        date := (now() at time zone 'Asia/Tokyo')::date;
  v_from      date := v_to - (v_days - 1);
  v_prev_to   date := v_from - 1;
  v_prev_from date := v_from - v_days;
  v_result    jsonb;
begin
  -- 権限チェック: オーナー or admin
  if not exists (
    select 1 from public.shop_staffs where shop_id = p_shop_id and user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    -- 日別 PV / UU（欠損日も 0 で埋める）
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('date', d::text, 'pv', pv, 'uu', uu) order by d), '[]'::jsonb)
      from (
        select gs::date as d,
               count(e.id)                  as pv,
               count(distinct e.visitor_id) as uu
        from generate_series(v_from, v_to, '1 day'::interval) gs
        left join public.shop_view_events e
          on e.shop_id = p_shop_id
         and e.event_type = 'view'
         and e.day = gs::date
        group by gs::date
      ) sub
    ),
    -- 期間合計
    'totals', (
      select jsonb_build_object(
        'pv', count(*),
        'uu', count(distinct visitor_id)
      )
      from public.shop_view_events
      where shop_id = p_shop_id and event_type = 'view' and day between v_from and v_to
    ),
    -- 前同期間（比較用）
    'prev_totals', (
      select jsonb_build_object(
        'pv', count(*),
        'uu', count(distinct visitor_id)
      )
      from public.shop_view_events
      where shop_id = p_shop_id and event_type = 'view' and day between v_prev_from and v_prev_to
    ),
    -- 流入元別
    'by_source', (
      select coalesce(jsonb_agg(jsonb_build_object('source', src, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select coalesce(source, 'direct') as src, count(*) as cnt
        from public.shop_view_events
        where shop_id = p_shop_id and event_type = 'view' and day between v_from and v_to
        group by coalesce(source, 'direct')
      ) sub
    ),
    -- アクション別（外部リンククリック）
    'actions', (
      select coalesce(jsonb_agg(jsonb_build_object('type', target_id, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select target_id, count(*) as cnt
        from public.shop_view_events
        where shop_id = p_shop_id and event_type = 'action'
          and target_id is not null and day between v_from and v_to
        group by target_id
      ) sub
    ),
    -- フォロー（期間内の新規フォロー数。shop_follows テーブルから正確に集計）
    'follows', (
      select count(*)
      from public.shop_follows
      where shop_id = p_shop_id
        and (created_at at time zone 'Asia/Tokyo')::date between v_from and v_to
    ),
    -- アイテム別閲覧ランキング TOP10
    'top_items', (
      select coalesce(jsonb_agg(jsonb_build_object('itemId', item_id, 'name', item_name, 'count', cnt) order by cnt desc), '[]'::jsonb)
      from (
        select e.target_id as item_id, si.name as item_name, count(*) as cnt
        from public.shop_view_events e
        join public.shop_items si on si.id = e.target_id::uuid
        where e.shop_id = p_shop_id and e.event_type = 'item_view'
          and e.target_id is not null and e.day between v_from and v_to
        group by e.target_id, si.name
        order by cnt desc
        limit 10
      ) sub
    ),
    -- 時間帯分布（0-23時, JST）
    'by_hour', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', h, 'count', cnt) order by h), '[]'::jsonb)
      from (
        select gs as h, count(e.id) as cnt
        from generate_series(0, 23) gs
        left join public.shop_view_events e
          on e.shop_id = p_shop_id
         and e.event_type = 'view'
         and e.day between v_from and v_to
         and extract(hour from (e.occurred_at at time zone 'Asia/Tokyo')) = gs
        group by gs
      ) sub
    ),
    -- 曜日分布（0=日 .. 6=土, JST）
    'by_weekday', (
      select coalesce(jsonb_agg(jsonb_build_object('weekday', w, 'count', cnt) order by w), '[]'::jsonb)
      from (
        select gs as w, count(e.id) as cnt
        from generate_series(0, 6) gs
        left join public.shop_view_events e
          on e.shop_id = p_shop_id
         and e.event_type = 'view'
         and e.day between v_from and v_to
         and extract(dow from (e.occurred_at at time zone 'Asia/Tokyo')) = gs
        group by gs
      ) sub
    )
  ) into v_result;

  return v_result;
end;
$$;

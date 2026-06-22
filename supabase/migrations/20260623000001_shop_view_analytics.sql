-- =============================================================
-- オーナー向けアクセス解析
-- 店舗詳細の閲覧(PV/UU)・アイテム閲覧・外部リンクアクションを計測
-- append-only のイベントテーブル + 集計RPC + 保持期間cron
-- =============================================================

create table public.shop_view_events (
  id          uuid        primary key default gen_random_uuid(),
  shop_id     uuid        not null references public.shops(id) on delete cascade,
  visitor_id  uuid        not null,                                  -- localStorage 発行の擬似ID（匿名UU用）
  user_id     uuid        references public.users(id) on delete set null, -- ログイン時のみ
  event_type  text        not null check (event_type in ('view', 'item_view', 'action')),
  source      text        check (source in ('search', 'area', 'share', 'brand', 'direct')), -- view のみ
  target_id   text,                                                  -- item_view=shop_item_id, action=種別(phone/website/instagram/x/tiktok)
  occurred_at timestamptz not null default now(),
  day         date        not null default (now() at time zone 'Asia/Tokyo')::date
);

create index shop_view_events_shop_day_idx  on public.shop_view_events (shop_id, day);
create index shop_view_events_shop_type_idx on public.shop_view_events (shop_id, event_type, day);

-- RLS 有効化。直接 SELECT/INSERT は禁止し、記録・集計は SECURITY DEFINER RPC 経由のみ。
alter table public.shop_view_events enable row level security;

-- =============================================================
-- record_shop_event: イベント記録（匿名含む）
-- 公開店舗のみ計上。入力検証あり。fire-and-forget 前提。
-- =============================================================

create or replace function public.record_shop_event(
  p_shop_id    uuid,
  p_visitor_id uuid,
  p_event_type text,
  p_source     text default null,
  p_target_id  text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- 入力検証
  if p_event_type not in ('view', 'item_view', 'action') then
    return;
  end if;
  if p_source is not null and p_source not in ('search', 'area', 'share', 'brand', 'direct') then
    p_source := null;
  end if;

  -- 公開店舗のみ計上
  if not exists (
    select 1 from public.shops where id = p_shop_id and status = 'public'
  ) then
    return;
  end if;

  insert into public.shop_view_events (shop_id, visitor_id, user_id, event_type, source, target_id)
  values (
    p_shop_id,
    p_visitor_id,
    v_uid,
    p_event_type,
    case when p_event_type = 'view' then nullif(p_source, '') else null end,
    nullif(p_target_id, '')
  );
end;
$$;

revoke all on function public.record_shop_event(uuid, uuid, text, text, text) from public;
grant execute on function public.record_shop_event(uuid, uuid, text, text, text) to anon, authenticated;

-- =============================================================
-- get_shop_view_analytics: オーナー向け集計
-- 当該店舗のオーナー(shop_staffs) または admin のみ。
-- p_days: 集計期間（日数、JST基準）。
-- =============================================================

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
    -- お気に入り（期間内の新規登録数。favorites テーブルから正確に集計）
    'favorites', (
      select count(*)
      from public.favorites
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

revoke all on function public.get_shop_view_analytics(uuid, int) from public;
grant execute on function public.get_shop_view_analytics(uuid, int) to authenticated;

-- =============================================================
-- pg_cron: 保持期間 180日。毎日 03:00 JST(UTC 18:00) に超過分を削除。
-- =============================================================

create extension if not exists pg_cron;

select cron.unschedule('purge-shop-view-events') where exists (
  select 1 from cron.job where jobname = 'purge-shop-view-events'
);

select cron.schedule(
  'purge-shop-view-events',
  '0 18 * * *',
  $$delete from public.shop_view_events
    where day < (current_timestamp at time zone 'Asia/Tokyo')::date - 180$$
);

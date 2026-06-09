-- =============================================================
-- Analytics daily snapshots
-- =============================================================

create table public.analytics_daily_snapshots (
  date       date        primary key,
  metrics    jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.analytics_daily_snapshots enable row level security;

create policy "analytics_snapshots: admin read" on public.analytics_daily_snapshots
  for select using ((select public.is_admin()));

create policy "analytics_snapshots: admin write" on public.analytics_daily_snapshots
  for all using ((select public.is_admin()));

-- =============================================================
-- 指定日の全指標を計算してJSONBで返す
-- =============================================================

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
    'reviews',   (
      select count(*) from public.reviews
      where (created_at at time zone 'Asia/Tokyo')::date = p_date
    ),
    'favorites', (
      select count(*) from public.favorites
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

-- =============================================================
-- 指定日のスナップショットを保存（冪等）
-- =============================================================

create or replace function public.upsert_analytics_snapshot(p_date date)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.analytics_daily_snapshots(date, metrics)
  values (p_date, public.compute_analytics_for_date(p_date))
  on conflict (date) do update set
    metrics    = excluded.metrics,
    updated_at = now();
end;
$$;

-- =============================================================
-- pg_cron: 毎日 00:05 JST（UTC 15:05）に前日分を保存
-- =============================================================

create extension if not exists pg_cron;

select cron.unschedule('save-analytics-daily') where exists (
  select 1 from cron.job where jobname = 'save-analytics-daily'
);

select cron.schedule(
  'save-analytics-daily',
  '5 15 * * *',
  $$select public.upsert_analytics_snapshot(
    (current_timestamp at time zone 'Asia/Tokyo')::date - 1
  )$$
);

-- =============================================================
-- バックフィル: アプリ開始日から昨日までを一括生成
-- =============================================================

do $$
declare
  d          date;
  start_date date;
begin
  select min((created_at at time zone 'Asia/Tokyo')::date)
    into start_date
    from public.users;

  if start_date is null then
    return;
  end if;

  for d in
    select generate_series(start_date, current_date - 1, '1 day'::interval)::date
  loop
    perform public.upsert_analytics_snapshot(d);
  end loop;
end;
$$;

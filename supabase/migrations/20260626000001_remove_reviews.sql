-- =============================================================
-- 店舗レビュー機能の削除
-- reviews / review_photos / review_reports テーブルと関連オブジェクトを削除し、
-- shops の評価集計カラム・検索/分析関数・通知タイプを整理する
-- =============================================================

-- ── 1. レビュー関連のトリガー・関数を削除 ────────────────────
drop trigger if exists on_review_change on public.reviews;
drop function if exists public.update_shop_review_stats() cascade;

drop trigger if exists on_review_insert_notify_owner on public.reviews;
drop function if exists public.notify_on_review_insert() cascade;

drop trigger if exists on_review_report_insert_notify_admin on public.review_reports;
drop function if exists public.notify_admins_on_review_report() cascade;

-- ── 2. レビュー投稿者向けの users 公開ポリシーを削除 ──────────
drop policy if exists "users: public read for review authors" on public.users;

-- ── 3. レビュー関連テーブルを削除 ────────────────────────────
drop table if exists public.review_reports cascade;
drop table if exists public.review_photos cascade;
drop table if exists public.reviews cascade;

-- ── 4. shops の評価集計カラムを削除 ──────────────────────────
-- search_shops が参照しているため先に関数を削除する
drop function if exists public.search_shops(text, int, int, int, int, int);

alter table public.shops drop column if exists review_count;
alter table public.shops drop column if exists average_rating;

-- ── 5. search_shops を評価カラムなしで再作成 ─────────────────
create function public.search_shops(
  p_query          text,
  p_area_id        int  default null,
  p_category_id    int  default null,
  p_price_range_id int  default null,
  p_limit          int  default 20,
  p_offset         int  default 0
)
returns table (
  id              uuid,
  name            text,
  description     text,
  favorite_count  int,
  created_at      timestamptz,
  updated_at      timestamptz,
  areas           jsonb,
  price_ranges    jsonb,
  shop_categories jsonb,
  shop_tags       jsonb,
  shop_photos     jsonb,
  shop_brands     jsonb,
  rank            float4
)
language sql stable
as $$
  with matched as (
    select distinct s.id,
      greatest(
        similarity(s.name, p_query),
        coalesce((
          select max(similarity(b.name, p_query))
          from public.brands b
          join public.shop_brands sb on sb.brand_id = b.id
          where sb.shop_id = s.id
        ), 0),
        coalesce((
          select max(similarity(t.name, p_query))
          from public.tags t
          join public.shop_tags st on st.tag_id = t.id
          where st.shop_id = s.id
        ), 0)
      )::float4 as rank
    from public.shops s
    where s.status = 'public'
      and (
        s.name ilike '%' || p_query || '%'
        or exists(
          select 1 from public.brands b
          join public.shop_brands sb on sb.brand_id = b.id
          where sb.shop_id = s.id and b.name ilike '%' || p_query || '%'
        )
        or exists(
          select 1 from public.tags t
          join public.shop_tags st on st.tag_id = t.id
          where st.shop_id = s.id and t.name ilike '%' || p_query || '%'
        )
        or exists(
          select 1 from public.areas a
          where a.id = s.area_id
            and (a.prefecture ilike '%' || p_query || '%' or a.city ilike '%' || p_query || '%')
        )
      )
      and (p_area_id        is null or s.area_id        = p_area_id)
      and (p_price_range_id is null or s.price_range_id = p_price_range_id)
      and (p_category_id    is null or exists(
        select 1 from public.shop_categories sc
        where sc.shop_id = s.id and sc.category_id = p_category_id
      ))
  )
  select
    s.id,
    s.name,
    s.description,
    s.favorite_count,
    s.created_at,
    s.updated_at,
    case when a.id is not null then
      jsonb_build_object('id', a.id, 'prefecture', a.prefecture, 'city', a.city, 'slug', a.slug)
    end as areas,
    case when pr.id is not null then
      jsonb_build_object('id', pr.id, 'label', pr.label, 'min_price', pr.min_price, 'max_price', pr.max_price)
    end as price_ranges,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'categories', jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name)
      ))
      from public.shop_categories sc
      join public.categories c on c.id = sc.category_id
      where sc.shop_id = s.id
    ), '[]'::jsonb) as shop_categories,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'tags', jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
      ))
      from public.shop_tags st
      join public.tags t on t.id = st.tag_id
      where st.shop_id = s.id
    ), '[]'::jsonb) as shop_tags,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'shop_id', p.shop_id,
        'storage_path', p.storage_path, 'order', p."order", 'created_at', p.created_at
      ) order by p."order")
      from public.shop_photos p
      where p.shop_id = s.id
    ), '[]'::jsonb) as shop_photos,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'brands', jsonb_build_object(
          'id', b.id, 'name', b.name, 'name_kana', b.name_kana,
          'aliases', b.aliases, 'status', b.status,
          'merged_into', b.merged_into, 'submitted_by', b.submitted_by,
          'created_at', b.created_at
        )
      ))
      from public.shop_brands sb
      join public.brands b on b.id = sb.brand_id
      where sb.shop_id = s.id
    ), '[]'::jsonb) as shop_brands,
    m.rank
  from matched m
  join public.shops s on s.id = m.id
  left join public.areas a on a.id = s.area_id
  left join public.price_ranges pr on pr.id = s.price_range_id
  order by m.rank desc
  limit p_limit offset p_offset;
$$;

-- ── 6. 分析スナップショット関数から reviews 指標を除外 ────────
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

-- ── 7. 通知タイプからレビュー関連を削除 ──────────────────────
delete from public.notifications
  where type in ('admin_review_report', 'review_posted');

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'wish_match',
    'owner_application_result',
    'admin_new_listing',
    'admin_new_contact',
    'news_published',
    'welcome',
    'share_rated',
    'share_commented'
  ));

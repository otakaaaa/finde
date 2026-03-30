-- =============================================================
-- Extensions
-- =============================================================
-- pg_trgm: ローカル開発用（PostgreSQL標準付属）
-- 本番 Supabase では pg_bigm を Dashboard > Database > Extensions から有効化し
-- インデックスを gin_trgm_ops に切り替えること
create extension if not exists pg_trgm;

-- =============================================================
-- Master tables
-- =============================================================

create table public.categories (
  id   serial primary key,
  code text not null unique check (code in ('mens', 'ladies', 'kids', 'unisex', 'vintage')),
  name text not null
);

insert into public.categories (code, name) values
  ('mens',    'メンズ'),
  ('ladies',  'レディース'),
  ('kids',    'キッズ'),
  ('unisex',  'ユニセックス'),
  ('vintage', 'ヴィンテージ');

create table public.price_ranges (
  id        serial primary key,
  label     text not null,
  min_price int,
  max_price int
);

insert into public.price_ranges (label, min_price, max_price) values
  ('～5,000円',          null,   5000),
  ('5,001～10,000円',    5001,  10000),
  ('10,001～30,000円',  10001,  30000),
  ('30,001～50,000円',  30001,  50000),
  ('50,001円～',        50001,   null);

create table public.areas (
  id         serial primary key,
  prefecture text not null,
  city       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

insert into public.areas (prefecture, city, slug) values
  ('東京都', '渋谷区',   'tokyo-shibuya'),
  ('東京都', '新宿区',   'tokyo-shinjuku'),
  ('東京都', '港区',     'tokyo-minato'),
  ('東京都', '中目黒',   'tokyo-nakameguro'),
  ('東京都', '表参道',   'tokyo-omotesando'),
  ('東京都', '原宿',     'tokyo-harajuku'),
  ('東京都', '恵比寿',   'tokyo-ebisu'),
  ('東京都', '吉祥寺',   'tokyo-kichijoji'),
  ('東京都', '下北沢',   'tokyo-shimokitazawa'),
  ('東京都', '銀座',     'tokyo-ginza'),
  ('大阪府', '北区',     'osaka-kita'),
  ('大阪府', '中央区',   'osaka-chuo'),
  ('大阪府', '心斎橋',   'osaka-shinsaibashi'),
  ('大阪府', '梅田',     'osaka-umeda'),
  ('神奈川県', '横浜市', 'kanagawa-yokohama'),
  ('愛知県', '名古屋市', 'aichi-nagoya'),
  ('福岡県', '福岡市',   'fukuoka-fukuoka'),
  ('北海道', '札幌市',   'hokkaido-sapporo'),
  ('宮城県', '仙台市',   'miyagi-sendai'),
  ('京都府', '京都市',   'kyoto-kyoto');

create table public.tags (
  id   serial primary key,
  name text not null unique,
  slug text not null unique
);

create table public.ng_words (
  id    serial primary key,
  word  text not null unique,
  score int  not null default 1
);

-- =============================================================
-- Users
-- =============================================================

create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'user'
                 check (role in ('user', 'shop_owner', 'admin')),
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Shops
-- =============================================================

create table public.shops (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  name_pending     text,
  description      text,
  area_id          int references public.areas(id),
  price_range_id   int references public.price_ranges(id),
  phone            text,
  website_url      text,
  instagram_url    text,
  twitter_url      text,
  business_hours   jsonb,
  closed_days      text[] default '{}',
  status           text not null default 'public'
                     check (status in ('public', 'private', 'pending')),
  review_count     int not null default 0,
  average_rating   numeric(3,2),
  favorite_count   int not null default 0,
  search_vector    tsvector generated always as (
    to_tsvector('simple', coalesce(name, ''))
  ) stored,
  created_by       uuid references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index shops_search_idx on public.shops using gin(search_vector);
create index shops_name_bigm_idx on public.shops using gin(name gin_trgm_ops);
create index shops_status_idx on public.shops(status);

create table public.shop_categories (
  shop_id     uuid not null references public.shops(id)     on delete cascade,
  category_id int  not null references public.categories(id) on delete cascade,
  primary key (shop_id, category_id)
);

create table public.shop_tags (
  shop_id uuid not null references public.shops(id) on delete cascade,
  tag_id  int  not null references public.tags(id)  on delete cascade,
  primary key (shop_id, tag_id)
);

create table public.shop_photos (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  storage_path text not null,
  "order"      int  not null default 0,
  created_at   timestamptz not null default now()
);

create table public.shop_staffs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  staff_role text not null default 'owner' check (staff_role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  unique (user_id, shop_id)
);

-- =============================================================
-- Brands
-- =============================================================

create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_kana     text,
  aliases       text[] default '{}',
  submitted_by  uuid references public.users(id),
  status        text not null default 'active'
                  check (status in ('active', 'merged')),
  merged_into   uuid references public.brands(id),
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' ||
      coalesce(name_kana, '')
    )
  ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index brands_search_idx on public.brands using gin(search_vector);
create index brands_name_bigm_idx on public.brands using gin(name gin_trgm_ops);

create table public.shop_brands (
  shop_id    uuid not null references public.shops(id)  on delete cascade,
  brand_id   uuid not null references public.brands(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shop_id, brand_id)
);

-- =============================================================
-- Reviews
-- =============================================================

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid     not null references public.shops(id) on delete cascade,
  user_id    uuid     not null references public.users(id) on delete cascade,
  body       text     not null,
  rating     smallint not null check (rating between 1 and 5),
  status     text     not null default 'published'
               check (status in ('published', 'flagged', 'hidden')),
  ng_score   int      not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index reviews_shop_id_idx on public.reviews(shop_id);

create table public.review_photos (
  id           uuid primary key default gen_random_uuid(),
  review_id    uuid not null references public.reviews(id) on delete cascade,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  reported_by uuid not null references public.users(id),
  reason      text not null
                check (reason in ('false_info', 'harassment', 'irrelevant', 'other')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (review_id, reported_by)
);

create or replace function public.update_shop_review_stats()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.shops
  set
    review_count   = (select count(*) from public.reviews where shop_id = coalesce(new.shop_id, old.shop_id) and status = 'published'),
    average_rating = (select avg(rating)::numeric(3,2) from public.reviews where shop_id = coalesce(new.shop_id, old.shop_id) and status = 'published')
  where id = coalesce(new.shop_id, old.shop_id);
  return coalesce(new, old);
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_shop_review_stats();

-- =============================================================
-- Favorites
-- =============================================================

create table public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, shop_id)
);

create or replace function public.update_shop_favorite_count()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.shops
  set favorite_count = (select count(*) from public.favorites where shop_id = coalesce(new.shop_id, old.shop_id))
  where id = coalesce(new.shop_id, old.shop_id);
  return coalesce(new, old);
end;
$$;

create trigger on_favorite_change
  after insert or delete on public.favorites
  for each row execute function public.update_shop_favorite_count();

-- =============================================================
-- Wishes
-- =============================================================

create table public.wishes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  type           text not null check (type in ('brand', 'item', 'condition')),
  category_id    int  not null references public.categories(id),
  price_range_id int  not null references public.price_ranges(id),
  area_id        int  not null references public.areas(id),
  size           text,
  tags           text[] default '{}',
  condition      text check (condition in ('new', 'used')),
  urgency        text check (urgency in ('low', 'medium', 'high')),
  note           text,
  is_public      bool not null default true,
  notify_email   bool not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- =============================================================
-- Listing requests & Owner applications
-- =============================================================

create table public.shop_listing_requests (
  id               uuid primary key default gen_random_uuid(),
  submitted_by     uuid not null references public.users(id),
  shop_name        text not null,
  address          text,
  category_ids     int[] default '{}',
  website_url      text,
  note             text,
  is_owner_request bool not null default false,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  reviewed_by      uuid references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.owner_applications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id),
  shop_id            uuid not null references public.shops(id),
  listing_request_id uuid references public.shop_listing_requests(id),
  status             text not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  reviewed_by        uuid references public.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- =============================================================
-- Subscriptions
-- =============================================================

create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  shop_id                uuid not null references public.shops(id),
  user_id                uuid not null references public.users(id),
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  plan                   text not null check (plan in ('monthly', 'yearly')),
  status                 text not null
                           check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- =============================================================
-- RPC: ウィッシュレコメンド
-- =============================================================

create or replace function public.get_wish_recommendations(
  p_category_id    int,
  p_price_range_id int,
  p_area_id        int
)
returns table (shop_id uuid, matched_count int)
language sql stable
as $$
  select s.id as shop_id,
    (
      (s.price_range_id = p_price_range_id)::int +
      (s.area_id = p_area_id)::int +
      exists(
        select 1 from public.shop_categories sc
        where sc.shop_id = s.id and sc.category_id = p_category_id
      )::int
    ) as matched_count
  from public.shops s
  where s.status = 'public'
    and s.area_id = p_area_id
    and s.price_range_id = p_price_range_id
    and exists(
      select 1 from public.shop_categories sc
      where sc.shop_id = s.id and sc.category_id = p_category_id
    )
  order by matched_count desc
  limit 10;
$$;

-- =============================================================
-- RPC: 横断検索（pg_bigm）
-- =============================================================

create or replace function public.search_shops(
  p_query          text,
  p_area_id        int  default null,
  p_category_id    int  default null,
  p_price_range_id int  default null,
  p_limit          int  default 20,
  p_offset         int  default 0
)
returns table (
  shop_id uuid,
  rank    float4
)
language sql stable
as $$
  select distinct s.id as shop_id,
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
    ) as rank
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
  order by rank desc
  limit p_limit offset p_offset;
$$;

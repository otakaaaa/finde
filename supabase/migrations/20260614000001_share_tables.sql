-- =============================================================
-- シャレ活（Share）: テーブル・インデックス・集計/モデレーショントリガ
-- =============================================================
-- 3軸を分離: state(draft/published) × visibility(public/private) × status(moderation)
-- 集計値(impression/rating/comment/bookmark)は非正規化カラム＋トリガで保持。

-- ── 投稿 ──────────────────────────────────────────────────────
create table public.share_posts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  body             text not null check (char_length(body) between 1 and 1000),
  -- 公開状態（下書き/公開）。モデレーションの status とは別軸
  state            text not null default 'published'
                     check (state in ('draft', 'published')),
  published_at     timestamptz,                              -- 公開時刻（draft は null）
  -- 公開範囲（MVPは public/private。followers/mutuals は将来フェーズ）
  visibility       text not null default 'public'
                     check (visibility in ('public', 'private')),
  -- モデレーション
  status           text not null default 'published'
                     check (status in ('published', 'flagged', 'hidden')),
  ng_score         int  not null default 0,
  -- 非正規化集計
  impression_count int  not null default 0,
  rating_count     int  not null default 0,
  rating_sum       int  not null default 0,   -- 平均 = sum / count
  comment_count    int  not null default 0,
  bookmark_count   int  not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index share_posts_timeline_idx on public.share_posts (visibility, status, state, published_at desc);
create index share_posts_user_idx     on public.share_posts (user_id, created_at desc);

-- ── 画像（最大5枚）────────────────────────────────────────────
create table public.share_post_photos (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.share_posts(id) on delete cascade,
  storage_path text not null,
  "order"      smallint not null default 0 check ("order" between 0 and 4),
  created_at   timestamptz not null default now()
);
create index share_post_photos_post_idx on public.share_post_photos (post_id, "order");

-- ── シャレ度（1〜10、1投稿1ユーザー1票）──────────────────────
create table public.share_ratings (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.share_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  score      smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create index share_ratings_post_idx on public.share_ratings (post_id);

-- ── コメント ──────────────────────────────────────────────────
create table public.share_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.share_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 300),
  status     text not null default 'published' check (status in ('published', 'hidden')),
  ng_score   int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index share_comments_post_idx on public.share_comments (post_id, created_at);

-- ── インプレッション（ログイン日次ユニーク）──────────────────
create table public.share_impressions (
  post_id uuid not null references public.share_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  day     date not null default current_date,
  primary key (post_id, user_id, day)
);

-- ── 通報 ──────────────────────────────────────────────────────
create table public.share_post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.share_posts(id) on delete cascade,
  comment_id  uuid references public.share_comments(id) on delete cascade,
  reported_by uuid not null references public.users(id),
  reason      text,
  created_at  timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

-- ── 店舗関連付け（0〜N、UI上限5）────────────────────────────
create table public.share_post_shops (
  post_id    uuid not null references public.share_posts(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, shop_id)
);
create index share_post_shops_shop_idx on public.share_post_shops (shop_id);

-- ── ブックマーク ──────────────────────────────────────────────
create table public.share_bookmarks (
  user_id    uuid not null references public.users(id) on delete cascade,
  post_id    uuid not null references public.share_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index share_bookmarks_user_idx on public.share_bookmarks (user_id, created_at desc);
create index share_bookmarks_post_idx on public.share_bookmarks (post_id);

-- =============================================================
-- BEFORE トリガ: 投稿（NGスキャン / published_at / updated_at）
-- =============================================================
create or replace function public.share_posts_before_write()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_ng int;
begin
  -- NGワード判定（既存 ng_words を流用、閾値3で自動 flagged）
  select coalesce(sum(w.score), 0) into v_ng
  from public.ng_words w
  where new.body ilike '%' || w.word || '%';
  new.ng_score := v_ng;
  if v_ng >= 3 and new.status = 'published' then
    new.status := 'flagged';
  end if;

  -- 公開時刻の設定（draft→published / 新規published）
  if new.state = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.state = 'draft' then
    new.published_at := null;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger share_posts_before_write
  before insert or update on public.share_posts
  for each row execute function public.share_posts_before_write();

-- =============================================================
-- BEFORE トリガ: コメント（NGスキャン / updated_at）
-- =============================================================
create or replace function public.share_comments_before_write()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_ng int;
begin
  select coalesce(sum(w.score), 0) into v_ng
  from public.ng_words w
  where new.body ilike '%' || w.word || '%';
  new.ng_score := v_ng;
  if v_ng >= 3 and new.status = 'published' then
    new.status := 'hidden';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger share_comments_before_write
  before insert or update on public.share_comments
  for each row execute function public.share_comments_before_write();

-- updated_at（シャレ度）
create or replace function public.share_ratings_touch()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger share_ratings_touch
  before update on public.share_ratings
  for each row execute function public.share_ratings_touch();

-- =============================================================
-- 画像5枚上限（BEFORE INSERT）
-- =============================================================
create or replace function public.share_photos_limit()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (select count(*) from public.share_post_photos where post_id = new.post_id) >= 5 then
    raise exception '画像は最大5枚までです';
  end if;
  return new;
end;
$$;

create trigger share_photos_limit
  before insert on public.share_post_photos
  for each row execute function public.share_photos_limit();

-- =============================================================
-- AFTER 集計トリガ: rating / comment / bookmark
-- 再計算方式（ドリフトを避ける）
-- =============================================================
create or replace function public.share_ratings_aggregate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  update public.share_posts p set
    rating_count = (select count(*)            from public.share_ratings r where r.post_id = v_post),
    rating_sum   = (select coalesce(sum(r.score), 0) from public.share_ratings r where r.post_id = v_post)
  where p.id = v_post;
  return null;
end;
$$;

create trigger share_ratings_aggregate
  after insert or update or delete on public.share_ratings
  for each row execute function public.share_ratings_aggregate();

create or replace function public.share_comments_aggregate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  update public.share_posts p set
    comment_count = (select count(*) from public.share_comments c
                     where c.post_id = v_post and c.status = 'published')
  where p.id = v_post;
  return null;
end;
$$;

create trigger share_comments_aggregate
  after insert or update or delete on public.share_comments
  for each row execute function public.share_comments_aggregate();

create or replace function public.share_bookmarks_aggregate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_post uuid := coalesce(new.post_id, old.post_id);
begin
  update public.share_posts p set
    bookmark_count = (select count(*) from public.share_bookmarks b where b.post_id = v_post)
  where p.id = v_post;
  return null;
end;
$$;

create trigger share_bookmarks_aggregate
  after insert or delete on public.share_bookmarks
  for each row execute function public.share_bookmarks_aggregate();

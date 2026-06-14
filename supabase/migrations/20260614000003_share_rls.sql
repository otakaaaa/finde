-- =============================================================
-- シャレ活: RLS ポリシー ＋ 可視判定ヘルパー
-- =============================================================
-- 公開範囲は DB 側で強制（フロントの出し分けに依存しない）。
-- MVP の可視範囲は public / private のみ。将来 followers/mutuals は
-- 各ヘルパー1箇所の拡張で全 select に波及する。

alter table public.share_posts        enable row level security;
alter table public.share_post_photos  enable row level security;
alter table public.share_ratings      enable row level security;
alter table public.share_comments     enable row level security;
alter table public.share_impressions  enable row level security;
alter table public.share_post_reports enable row level security;
alter table public.share_post_shops   enable row level security;
alter table public.share_bookmarks    enable row level security;

-- ── ヘルパー（security definer で RLS を回避し再帰を防ぐ）──────

-- 投稿を閲覧できるか
create or replace function public.share_post_visible(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.share_posts p
    where p.id = p_post_id
      and (
        public.is_admin()
        or p.user_id = auth.uid()
        or (p.state = 'published' and p.status = 'published' and p.visibility = 'public')
      )
  );
$$;

-- 投稿にシャレ度を送れるか（公開・公開範囲public・自投稿でない）
create or replace function public.share_post_ratable(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.share_posts p
    where p.id = p_post_id
      and p.state = 'published'
      and p.status = 'published'
      and p.visibility = 'public'
      and p.user_id <> auth.uid()
  );
$$;

-- 投稿にコメントできるか（公開済み・公開範囲public または 自分の投稿）
create or replace function public.share_post_commentable(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.share_posts p
    where p.id = p_post_id
      and p.state = 'published'
      and p.status = 'published'
      and (p.visibility = 'public' or p.user_id = auth.uid())
  );
$$;

-- =============================================================
-- share_posts
-- =============================================================
create policy "share_posts: visible read" on public.share_posts
  for select using (
    (select public.is_admin())
    or user_id = (select auth.uid())
    or (state = 'published' and status = 'published' and visibility = 'public')
  );

create policy "share_posts: self insert" on public.share_posts
  for insert with check ((select auth.uid()) = user_id);

create policy "share_posts: self and admin update" on public.share_posts
  for update using (
    user_id = (select auth.uid()) or (select public.is_admin())
  )
  with check (
    (user_id = (select auth.uid()) and status in ('published', 'flagged'))
    or (select public.is_admin())
  );

create policy "share_posts: self and admin delete" on public.share_posts
  for delete using (
    user_id = (select auth.uid()) or (select public.is_admin())
  );

-- =============================================================
-- share_post_photos
-- =============================================================
create policy "share_post_photos: visible read" on public.share_post_photos
  for select using ((select public.share_post_visible(post_id)));

create policy "share_post_photos: owner write" on public.share_post_photos
  for all using (
    exists (select 1 from public.share_posts p where p.id = post_id and p.user_id = (select auth.uid()))
    or (select public.is_admin())
  )
  with check (
    exists (select 1 from public.share_posts p where p.id = post_id and p.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- =============================================================
-- share_post_shops
-- =============================================================
create policy "share_post_shops: visible read" on public.share_post_shops
  for select using ((select public.share_post_visible(post_id)));

create policy "share_post_shops: owner write" on public.share_post_shops
  for all using (
    exists (select 1 from public.share_posts p where p.id = post_id and p.user_id = (select auth.uid()))
    or (select public.is_admin())
  )
  with check (
    exists (select 1 from public.share_posts p where p.id = post_id and p.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- =============================================================
-- share_ratings
-- =============================================================
create policy "share_ratings: read" on public.share_ratings
  for select using (true);

create policy "share_ratings: insert ratable" on public.share_ratings
  for insert with check (
    (select auth.uid()) = user_id
    and (select public.share_post_ratable(post_id))
  );

create policy "share_ratings: self update" on public.share_ratings
  for update using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (select public.share_post_ratable(post_id))
  );

create policy "share_ratings: self and admin delete" on public.share_ratings
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- 自投稿への評価を禁止（RLS に加えた防御）
create or replace function public.share_no_self_rating()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.share_posts p
    where p.id = new.post_id and p.user_id = new.user_id
  ) then
    raise exception '自分の投稿にはシャレ度を送れません';
  end if;
  return new;
end;
$$;

create trigger share_no_self_rating
  before insert or update on public.share_ratings
  for each row execute function public.share_no_self_rating();

-- =============================================================
-- share_comments
-- =============================================================
create policy "share_comments: visible read" on public.share_comments
  for select using (
    (status = 'published' and (select public.share_post_visible(post_id)))
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "share_comments: insert commentable" on public.share_comments
  for insert with check (
    (select auth.uid()) = user_id
    and (select public.share_post_commentable(post_id))
  );

create policy "share_comments: self and admin update" on public.share_comments
  for update using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "share_comments: self and admin delete" on public.share_comments
  for delete using (user_id = (select auth.uid()) or (select public.is_admin()));

-- =============================================================
-- share_bookmarks（本人のみ）
-- =============================================================
create policy "share_bookmarks: self all" on public.share_bookmarks
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- =============================================================
-- share_impressions（直接アクセス不可。記録は RPC 経由）
-- =============================================================
create policy "share_impressions: admin read" on public.share_impressions
  for select using ((select public.is_admin()));

-- =============================================================
-- share_post_reports
-- =============================================================
create policy "share_post_reports: admin read" on public.share_post_reports
  for select using ((select public.is_admin()));

create policy "share_post_reports: authenticated insert" on public.share_post_reports
  for insert with check ((select auth.uid()) = reported_by);

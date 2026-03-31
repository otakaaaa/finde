-- =============================================================
-- Enable RLS on all tables
-- =============================================================

alter table public.users                 enable row level security;
alter table public.areas                 enable row level security;
alter table public.categories            enable row level security;
alter table public.price_ranges          enable row level security;
alter table public.tags                  enable row level security;
alter table public.ng_words              enable row level security;
alter table public.shops                 enable row level security;
alter table public.shop_categories       enable row level security;
alter table public.shop_tags             enable row level security;
alter table public.shop_photos           enable row level security;
alter table public.shop_staffs           enable row level security;
alter table public.brands                enable row level security;
alter table public.shop_brands           enable row level security;
alter table public.reviews               enable row level security;
alter table public.review_photos         enable row level security;
alter table public.review_reports        enable row level security;
alter table public.favorites             enable row level security;
alter table public.wishes                enable row level security;
alter table public.shop_listing_requests enable row level security;
alter table public.owner_applications    enable row level security;
alter table public.subscriptions         enable row level security;

-- =============================================================
-- Helper: is_admin()
-- =============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =============================================================
-- Master tables: 全員読み取り可
-- =============================================================

create policy "areas: public read"        on public.areas        for select using (true);
create policy "categories: public read"   on public.categories   for select using (true);
create policy "price_ranges: public read" on public.price_ranges for select using (true);
create policy "tags: public read"         on public.tags         for select using (true);

-- ng_words: 全読み取り禁止（Edge Function の service role のみ）

-- =============================================================
-- users
-- =============================================================

create policy "users: self and admin read" on public.users
  for select using (id = auth.uid() or public.is_admin());

-- レビュー投稿者など、公開コンテンツに紐づくユーザーの基本情報は誰でも参照可能
create policy "users: public read for review authors" on public.users
  for select using (
    exists (
      select 1 from public.reviews r
      where r.user_id = public.users.id
        and r.status = 'published'
    )
  );

create policy "users: self update" on public.users
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.users where id = auth.uid())
  );

-- =============================================================
-- shops
-- =============================================================

create policy "shops: public read" on public.shops
  for select using (status = 'public' or public.is_admin());

create policy "shops: admin insert" on public.shops
  for insert with check (public.is_admin());

create policy "shops: admin update" on public.shops
  for update using (public.is_admin());

create policy "shop_categories: public read" on public.shop_categories
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or public.is_admin()))
  );
create policy "shop_categories: admin write" on public.shop_categories
  for all using (public.is_admin());

create policy "shop_tags: public read" on public.shop_tags
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or public.is_admin()))
  );
create policy "shop_tags: admin write" on public.shop_tags
  for all using (public.is_admin());

create policy "shop_photos: public read" on public.shop_photos
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or public.is_admin()))
  );
create policy "shop_photos: owner write" on public.shop_photos
  for all using (
    public.is_admin()
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

create policy "shop_staffs: owner read" on public.shop_staffs
  for select using (user_id = auth.uid() or public.is_admin());

create policy "shop_staffs: admin write" on public.shop_staffs
  for all using (public.is_admin());

-- =============================================================
-- brands
-- =============================================================

create policy "brands: public read" on public.brands
  for select using (status = 'active' or public.is_admin());

create policy "brands: authenticated insert" on public.brands
  for insert with check (auth.uid() is not null);

create policy "brands: admin update" on public.brands
  for update using (public.is_admin());

create policy "shop_brands: public read" on public.shop_brands
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or public.is_admin()))
  );
create policy "shop_brands: owner write" on public.shop_brands
  for all using (
    public.is_admin()
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

-- =============================================================
-- reviews
-- =============================================================

create policy "reviews: public read" on public.reviews
  for select using (status = 'published' or user_id = auth.uid() or public.is_admin());

create policy "reviews: authenticated insert" on public.reviews
  for insert with check (auth.uid() is not null and user_id = auth.uid());

create policy "reviews: self and admin update" on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (
    (user_id = auth.uid() and status = 'published')
    or public.is_admin()
  );

create policy "review_photos: self read" on public.review_photos
  for select using (
    exists(select 1 from public.reviews r where r.id = review_id and (r.status = 'published' or r.user_id = auth.uid()))
  );
create policy "review_photos: self write" on public.review_photos
  for all using (
    exists(select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
    or public.is_admin()
  );

create policy "review_reports: admin read" on public.review_reports
  for select using (public.is_admin());

create policy "review_reports: authenticated insert" on public.review_reports
  for insert with check (auth.uid() is not null and reported_by = auth.uid());

-- =============================================================
-- favorites
-- =============================================================

create policy "favorites: self read" on public.favorites
  for select using (user_id = auth.uid());

create policy "favorites: self write" on public.favorites
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================
-- wishes
-- =============================================================

create policy "wishes: public and self read" on public.wishes
  for select using (is_public = true or user_id = auth.uid() or public.is_admin());

create policy "wishes: self write" on public.wishes
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =============================================================
-- shop_listing_requests
-- =============================================================

create policy "listing_requests: self and admin read" on public.shop_listing_requests
  for select using (submitted_by = auth.uid() or public.is_admin());

create policy "listing_requests: authenticated insert" on public.shop_listing_requests
  for insert with check (auth.uid() is not null and submitted_by = auth.uid());

create policy "listing_requests: admin update" on public.shop_listing_requests
  for update using (public.is_admin());

-- =============================================================
-- owner_applications
-- =============================================================

create policy "owner_applications: self and admin read" on public.owner_applications
  for select using (user_id = auth.uid() or public.is_admin());

create policy "owner_applications: admin write" on public.owner_applications
  for all using (public.is_admin());

-- =============================================================
-- subscriptions
-- =============================================================

create policy "subscriptions: self and admin read" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- INSERT/UPDATE は service role（Edge Function）のみ可（RLS ポリシーなし = 拒否）

-- Fix RLS performance: replace bare public.is_admin() calls with
-- (select public.is_admin()).
--
-- PostgreSQL evaluates STABLE functions once per row inside RLS policies
-- unless they are wrapped in a sub-SELECT, which forces a single evaluation
-- per statement. is_admin() does a subquery against the users table, so the
-- bare form causes N extra user-table lookups for every N rows scanned —
-- including all rows skipped by OFFSET on later pages.

-- ── users ────────────────────────────────────────────────────────────────────

drop policy if exists "users: self and admin read" on public.users;
create policy "users: self and admin read" on public.users
  for select using (id = auth.uid() or (select public.is_admin()));

-- ── shops ────────────────────────────────────────────────────────────────────

drop policy if exists "shops: public read"   on public.shops;
drop policy if exists "shops: admin insert"  on public.shops;
drop policy if exists "shops: admin update"  on public.shops;

create policy "shops: public read" on public.shops
  for select using (status = 'public' or (select public.is_admin()));

create policy "shops: admin insert" on public.shops
  for insert with check ((select public.is_admin()));

create policy "shops: admin update" on public.shops
  for update using ((select public.is_admin()));

-- ── shop_categories ──────────────────────────────────────────────────────────

drop policy if exists "shop_categories: public read"  on public.shop_categories;
drop policy if exists "shop_categories: admin write"  on public.shop_categories;

create policy "shop_categories: public read" on public.shop_categories
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or (select public.is_admin())))
  );
create policy "shop_categories: admin write" on public.shop_categories
  for all using ((select public.is_admin()));

-- ── shop_tags ────────────────────────────────────────────────────────────────

drop policy if exists "shop_tags: public read"  on public.shop_tags;
drop policy if exists "shop_tags: admin write"  on public.shop_tags;

create policy "shop_tags: public read" on public.shop_tags
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or (select public.is_admin())))
  );
create policy "shop_tags: admin write" on public.shop_tags
  for all using ((select public.is_admin()));

-- ── shop_photos ──────────────────────────────────────────────────────────────

drop policy if exists "shop_photos: public read"  on public.shop_photos;
drop policy if exists "shop_photos: owner write"  on public.shop_photos;

create policy "shop_photos: public read" on public.shop_photos
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or (select public.is_admin())))
  );
create policy "shop_photos: owner write" on public.shop_photos
  for all using (
    (select public.is_admin())
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

-- ── shop_staffs ──────────────────────────────────────────────────────────────

drop policy if exists "shop_staffs: owner read"   on public.shop_staffs;
drop policy if exists "shop_staffs: admin write"  on public.shop_staffs;

create policy "shop_staffs: owner read" on public.shop_staffs
  for select using (user_id = auth.uid() or (select public.is_admin()));

create policy "shop_staffs: admin write" on public.shop_staffs
  for all using ((select public.is_admin()));

-- ── brands ───────────────────────────────────────────────────────────────────

drop policy if exists "brands: public read"   on public.brands;
drop policy if exists "brands: admin update"  on public.brands;

create policy "brands: public read" on public.brands
  for select using (status = 'active' or (select public.is_admin()));

create policy "brands: admin update" on public.brands
  for update using ((select public.is_admin()));

-- ── shop_brands ──────────────────────────────────────────────────────────────

drop policy if exists "shop_brands: public read"  on public.shop_brands;
drop policy if exists "shop_brands: owner write"  on public.shop_brands;

create policy "shop_brands: public read" on public.shop_brands
  for select using (
    exists(select 1 from public.shops s where s.id = shop_id and (s.status = 'public' or (select public.is_admin())))
  );
create policy "shop_brands: owner write" on public.shop_brands
  for all using (
    (select public.is_admin())
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

-- ── reviews ──────────────────────────────────────────────────────────────────

drop policy if exists "reviews: public read"            on public.reviews;
drop policy if exists "reviews: self and admin update"  on public.reviews;

create policy "reviews: public read" on public.reviews
  for select using (status = 'published' or user_id = auth.uid() or (select public.is_admin()));

create policy "reviews: self and admin update" on public.reviews
  for update using (user_id = auth.uid() or (select public.is_admin()))
  with check (
    (user_id = auth.uid() and status = 'published')
    or (select public.is_admin())
  );

-- ── review_photos ────────────────────────────────────────────────────────────

drop policy if exists "review_photos: self write" on public.review_photos;

create policy "review_photos: self write" on public.review_photos
  for all using (
    exists(select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
    or (select public.is_admin())
  );

-- ── review_reports ───────────────────────────────────────────────────────────

drop policy if exists "review_reports: admin read" on public.review_reports;

create policy "review_reports: admin read" on public.review_reports
  for select using ((select public.is_admin()));

-- ── wishes ───────────────────────────────────────────────────────────────────

drop policy if exists "wishes: public and self read" on public.wishes;

create policy "wishes: public and self read" on public.wishes
  for select using (is_public = true or user_id = auth.uid() or (select public.is_admin()));

-- ── shop_listing_requests ────────────────────────────────────────────────────

drop policy if exists "listing_requests: self and admin read"  on public.shop_listing_requests;
drop policy if exists "listing_requests: admin update"         on public.shop_listing_requests;

create policy "listing_requests: self and admin read" on public.shop_listing_requests
  for select using (submitted_by = auth.uid() or (select public.is_admin()));

create policy "listing_requests: admin update" on public.shop_listing_requests
  for update using ((select public.is_admin()));

-- ── owner_applications ───────────────────────────────────────────────────────

drop policy if exists "owner_applications: self and admin read" on public.owner_applications;
drop policy if exists "owner_applications: admin write"         on public.owner_applications;

create policy "owner_applications: self and admin read" on public.owner_applications
  for select using (user_id = auth.uid() or (select public.is_admin()));

create policy "owner_applications: admin write" on public.owner_applications
  for all using ((select public.is_admin()));

-- ── subscriptions ────────────────────────────────────────────────────────────

drop policy if exists "subscriptions: self and admin read" on public.subscriptions;

create policy "subscriptions: self and admin read" on public.subscriptions
  for select using (user_id = auth.uid() or (select public.is_admin()));

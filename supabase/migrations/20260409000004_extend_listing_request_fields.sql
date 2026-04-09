-- =============================================================
-- shop_listing_requests にカラム追加
-- 店舗登録と同等の情報を申請フォームで入力できるようにする
-- =============================================================

alter table public.shop_listing_requests
  add column if not exists description   text,
  add column if not exists prefecture_id smallint references public.prefectures(id),
  add column if not exists city_id       int      references public.cities(id),
  add column if not exists price_range_id int     references public.price_ranges(id),
  add column if not exists phone         text,
  add column if not exists instagram_url text,
  add column if not exists twitter_url   text,
  add column if not exists tiktok_url    text;

-- =============================================================
-- listing_request_photos
-- 掲載申請に添付された写真。承認時に shop_photos へコピーされる
-- =============================================================

create table public.listing_request_photos (
  id           uuid        primary key default gen_random_uuid(),
  request_id   uuid        not null references public.shop_listing_requests(id) on delete cascade,
  storage_path text        not null,
  "order"      int         not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.listing_request_photos enable row level security;

-- 申請者本人または管理者が読める
create policy "listing_request_photos: self and admin read"
  on public.listing_request_photos for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.shop_listing_requests r
      where r.id = request_id and r.submitted_by = auth.uid()
    )
  );

-- 申請者本人または管理者が登録できる
create policy "listing_request_photos: self and admin insert"
  on public.listing_request_photos for insert
  with check (
    public.is_admin()
    or exists (
      select 1 from public.shop_listing_requests r
      where r.id = request_id and r.submitted_by = auth.uid()
    )
  );

-- 申請者本人または管理者が削除できる
create policy "listing_request_photos: self and admin delete"
  on public.listing_request_photos for delete
  using (
    public.is_admin()
    or exists (
      select 1 from public.shop_listing_requests r
      where r.id = request_id and r.submitted_by = auth.uid()
    )
  );

-- =============================================================
-- Storage: shop-photos バケットに掲載申請用のパス許可を追加
-- パス形式: listing-requests/${request_id}/${uuid}.ext
-- =============================================================

-- 申請者本人または管理者がアップロード可能
create policy "shop-photos: listing request upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'shop-photos'
    and (storage.foldername(name))[1] = 'listing-requests'
    and (
      public.is_admin()
      or exists (
        select 1 from public.shop_listing_requests r
        where r.id::text = (storage.foldername(name))[2]
          and r.submitted_by = auth.uid()
      )
    )
  );

-- 申請者本人または管理者が削除可能
create policy "shop-photos: listing request delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'shop-photos'
    and (storage.foldername(name))[1] = 'listing-requests'
    and (
      public.is_admin()
      or exists (
        select 1 from public.shop_listing_requests r
        where r.id::text = (storage.foldername(name))[2]
          and r.submitted_by = auth.uid()
      )
    )
  );

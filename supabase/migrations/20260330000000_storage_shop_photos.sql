-- =============================================================
-- Storage: shop-photos bucket
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-photos',
  'shop-photos',
  true,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read (bucket is public, but explicit policy for clarity)
create policy "shop-photos: public read"
  on storage.objects for select
  using (bucket_id = 'shop-photos');

-- Admin or shop owner/staff can upload
create policy "shop-photos: admin or owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'shop-photos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.shop_staffs ss
        where ss.user_id = auth.uid()
          and ss.shop_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Admin or shop owner/staff can delete
create policy "shop-photos: admin or owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'shop-photos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.shop_staffs ss
        where ss.user_id = auth.uid()
          and ss.shop_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- =============================================================
-- Storage: share-photos bucket（シャレ活の投稿画像）
-- =============================================================
-- path convention: {user_id}/{post_id}/{uuid}.{ext}
-- 1枚 5 MiB まで・jpeg/png/webp・public read・本人のみ書き込み。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'share-photos',
  'share-photos',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read
create policy "share-photos: public read"
  on storage.objects for select
  using (bucket_id = 'share-photos');

-- 本人のみ自フォルダに insert
create policy "share-photos: self insert"
  on storage.objects for insert
  with check (
    bucket_id = 'share-photos'
    and (select auth.uid()) is not null
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 本人のみ自フォルダを update
create policy "share-photos: self update"
  on storage.objects for update
  using (
    bucket_id = 'share-photos'
    and (select auth.uid()) is not null
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 本人のみ自フォルダを delete
create policy "share-photos: self delete"
  on storage.objects for delete
  using (
    bucket_id = 'share-photos'
    and (select auth.uid()) is not null
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

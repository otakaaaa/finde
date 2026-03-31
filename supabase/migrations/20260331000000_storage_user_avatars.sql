-- =============================================================
-- Storage: user-avatars bucket
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Public read
create policy "user-avatars: public read"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

-- Authenticated users can upload their own avatar
-- Path convention: {user_id}/{filename}
create policy "user-avatars: self insert"
  on storage.objects for insert
  with check (
    bucket_id = 'user-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own avatar
create policy "user-avatars: self update"
  on storage.objects for update
  using (
    bucket_id = 'user-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own avatar
create policy "user-avatars: self delete"
  on storage.objects for delete
  using (
    bucket_id = 'user-avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- share_bookmark_folders: ブックマークフォルダ管理テーブル

create table public.share_bookmark_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 50),
  created_at timestamptz not null default now()
);

create index share_bookmark_folders_user_idx on public.share_bookmark_folders (user_id, created_at);

-- share_bookmarks にフォルダ参照を追加（null = フォルダなし）
alter table public.share_bookmarks
  add column folder_id uuid references public.share_bookmark_folders(id) on delete set null;

create index share_bookmarks_folder_idx on public.share_bookmarks (user_id, folder_id);

-- RLS
alter table public.share_bookmark_folders enable row level security;

create policy "share_bookmark_folders: self all" on public.share_bookmark_folders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

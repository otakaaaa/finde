-- press_releases テーブル作成
create table public.press_releases (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  body         text        not null,
  published_at timestamptz,
  created_by   uuid        references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 公開記事の降順取得用インデックス
create index press_releases_published_at_idx
  on public.press_releases (published_at desc nulls last)
  where published_at is not null;

-- RLS 有効化
alter table public.press_releases enable row level security;

-- 公開済み記事は全員閲覧可（published_at が現在時刻以前）
create policy "Anyone can read published press releases"
  on public.press_releases
  for select
  using (published_at is not null and published_at <= now());

-- admin は全操作可
create policy "Admin can manage press releases"
  on public.press_releases
  for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

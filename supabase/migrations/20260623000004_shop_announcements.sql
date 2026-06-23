-- =============================================================
-- shop_announcements: 店舗専用お知らせ
--   タイトル＋本文＋任意リンク＋任意サムネ画像・掲載期間で出し分け
-- =============================================================

create table public.shop_announcements (
  id          uuid        primary key default gen_random_uuid(),
  shop_id     uuid        not null references public.shops(id) on delete cascade,
  title       text        not null,
  body        text        not null,
  link_url    text,
  image_path  text,
  is_active   boolean     not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 新着順（starts_at, なければ created_at）の取得用
create index shop_announcements_shop_idx
  on public.shop_announcements (shop_id, starts_at desc nulls last, created_at desc);

-- updated_at 自動更新トリガ
create or replace function public.touch_shop_announcement()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shop_announcements_updated_at
  before update on public.shop_announcements
  for each row execute function public.touch_shop_announcement();

alter table public.shop_announcements enable row level security;

-- 公開店舗の、掲載中（is_active かつ 期間内）お知らせは誰でも閲覧可能
create policy "shop_announcements: public read"
  on public.shop_announcements for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.status = 'public'
    )
  );

-- オーナーは自店舗のお知らせを全操作可能
create policy "shop_announcements: owner all"
  on public.shop_announcements
  using (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_announcements.shop_id and ss.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_announcements.shop_id and ss.user_id = auth.uid()
    )
  );

-- 管理者は全操作可能
create policy "shop_announcements: admin all"
  on public.shop_announcements
  using  (public.is_admin())
  with check (public.is_admin());

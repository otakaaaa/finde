-- =============================================================
-- shop_banners: 店舗専用バナー（画像＋リンク・掲載期間・カルーセル）
-- =============================================================

create table public.shop_banners (
  id          uuid        primary key default gen_random_uuid(),
  shop_id     uuid        not null references public.shops(id) on delete cascade,
  image_path  text        not null,
  link_url    text,
  "order"     smallint    not null default 0,
  is_active   boolean     not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index shop_banners_shop_idx on public.shop_banners (shop_id, "order");

-- updated_at 自動更新トリガ
create or replace function public.touch_shop_banner()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shop_banners_updated_at
  before update on public.shop_banners
  for each row execute function public.touch_shop_banner();

alter table public.shop_banners enable row level security;

-- 公開店舗の、掲載中（is_active かつ 期間内）バナーは誰でも閲覧可能
create policy "shop_banners: public read"
  on public.shop_banners for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >= now())
    and exists (
      select 1 from public.shops s
      where s.id = shop_id and s.status = 'public'
    )
  );

-- オーナーは自店舗のバナーを全操作可能
create policy "shop_banners: owner all"
  on public.shop_banners
  using (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_banners.shop_id and ss.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_banners.shop_id and ss.user_id = auth.uid()
    )
  );

-- 管理者は全操作可能
create policy "shop_banners: admin all"
  on public.shop_banners
  using  (public.is_admin())
  with check (public.is_admin());

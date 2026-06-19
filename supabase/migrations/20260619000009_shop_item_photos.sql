-- =============================================================
-- shop_item_photos: アイテム画像（最大10枚）
-- =============================================================

create table public.shop_item_photos (
  id           uuid        primary key default gen_random_uuid(),
  shop_item_id uuid        not null references public.shop_items(id) on delete cascade,
  storage_path text        not null,
  "order"      smallint    not null default 0 check ("order" between 0 and 9),
  created_at   timestamptz not null default now()
);

create index shop_item_photos_item_idx on public.shop_item_photos (shop_item_id, "order");

alter table public.shop_item_photos enable row level security;

-- アイテムが閲覧可能なら画像も読める
create policy "shop_item_photos: public read"
  on public.shop_item_photos for select
  using (
    exists (
      select 1 from public.shop_items si
      join public.shops s on s.id = si.shop_id
      where si.id = shop_item_id
        and si.is_available = true
        and s.status = 'public'
    )
  );

-- オーナーは画像を管理可能（10枚制限はアプリ側で制御）
create policy "shop_item_photos: owner all"
  on public.shop_item_photos
  using (
    exists (
      select 1 from public.shop_items si
      join public.shop_staffs ss on ss.shop_id = si.shop_id
      where si.id = shop_item_id and ss.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shop_items si
      join public.shop_staffs ss on ss.shop_id = si.shop_id
      where si.id = shop_item_id and ss.user_id = auth.uid()
    )
  );

-- 管理者は全操作可能
create policy "shop_item_photos: admin all"
  on public.shop_item_photos
  using  (public.is_admin())
  with check (public.is_admin());

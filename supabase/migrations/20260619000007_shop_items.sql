-- =============================================================
-- shop_items: 店舗が登録するアイテム詳細
-- =============================================================

create table public.shop_items (
  id           uuid        primary key default gen_random_uuid(),
  shop_id      uuid        not null references public.shops(id) on delete cascade,
  item_type_id int         references public.item_types(id),
  brand_id     uuid        references public.brands(id),
  name         text        not null,
  description  text,
  size_ids     int[]       not null default '{}',
  is_available boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index shop_items_shop_idx      on public.shop_items (shop_id);
create index shop_items_type_idx      on public.shop_items (item_type_id);
create index shop_items_brand_idx     on public.shop_items (brand_id);
create index shop_items_available_idx on public.shop_items (shop_id, is_available);

alter table public.shop_items enable row level security;

-- 公開店舗の公開アイテムは誰でも読める
create policy "shop_items: public read"
  on public.shop_items for select
  using (
    is_available = true and
    exists (select 1 from public.shops s where s.id = shop_id and s.status = 'public')
  );

-- オーナーは自分の店舗アイテムを全操作可能
create policy "shop_items: owner all"
  on public.shop_items
  using (
    exists (select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

-- 管理者は全操作可能
create policy "shop_items: admin all"
  on public.shop_items
  using  (public.is_admin())
  with check (public.is_admin());

-- updated_at 自動更新トリガ
create or replace function public.touch_shop_item()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger shop_items_updated_at
  before update on public.shop_items
  for each row execute function public.touch_shop_item();

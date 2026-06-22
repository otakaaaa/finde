-- =============================================================
-- shop_item_materials: アイテム × 素材 ジャンクション
-- =============================================================

create table public.shop_item_materials (
  shop_item_id     uuid not null references public.shop_items(id) on delete cascade,
  material_type_id int  not null references public.material_types(id) on delete cascade,
  primary key (shop_item_id, material_type_id)
);

create index shop_item_materials_item_idx     on public.shop_item_materials (shop_item_id);
create index shop_item_materials_material_idx on public.shop_item_materials (material_type_id);

alter table public.shop_item_materials enable row level security;

-- アイテムが閲覧可能なら素材も読める
create policy "shop_item_materials: public read"
  on public.shop_item_materials for select
  using (
    exists (
      select 1 from public.shop_items si
      join public.shops s on s.id = si.shop_id
      where si.id = shop_item_id
        and si.is_available = true
        and s.status = 'public'
    )
  );

-- オーナーは素材を管理可能
create policy "shop_item_materials: owner all"
  on public.shop_item_materials
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
create policy "shop_item_materials: admin all"
  on public.shop_item_materials
  using  (public.is_admin())
  with check (public.is_admin());

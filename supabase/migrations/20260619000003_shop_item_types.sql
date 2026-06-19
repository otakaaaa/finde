-- =============================================================
-- shop_item_types: 店舗が取り扱うアイテムタイプ（ジャンクション）
-- =============================================================

create table public.shop_item_types (
  shop_id      uuid not null references public.shops(id) on delete cascade,
  item_type_id int  not null references public.item_types(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (shop_id, item_type_id)
);

create index shop_item_types_shop_idx on public.shop_item_types (shop_id);
create index shop_item_types_type_idx on public.shop_item_types (item_type_id);

alter table public.shop_item_types enable row level security;

-- 公開店舗のアイテムタイプは誰でも読める
create policy "shop_item_types: public read"
  on public.shop_item_types for select
  using (
    exists (
      select 1 from public.shops s
      where s.id = shop_id and s.status = 'public'
    )
  );

-- オーナー（shop_staffs に登録されているユーザー）のみ書き込み可
create policy "shop_item_types: owner insert"
  on public.shop_item_types for insert
  with check (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_id and ss.user_id = auth.uid()
    )
  );

create policy "shop_item_types: owner delete"
  on public.shop_item_types for delete
  using (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = shop_id and ss.user_id = auth.uid()
    )
  );

create policy "shop_item_types: admin all"
  on public.shop_item_types for all
  using ((select public.is_admin()));

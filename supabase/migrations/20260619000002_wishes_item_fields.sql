-- =============================================================
-- wishes テーブルにアイテムカテゴリ・アイテムタイプを追加
-- =============================================================

alter table public.wishes
  add column item_category_id int references public.item_categories(id) on delete set null,
  add column item_type_id     int references public.item_types(id) on delete set null;

create index wishes_item_category_idx on public.wishes (item_category_id);
create index wishes_item_type_idx     on public.wishes (item_type_id);

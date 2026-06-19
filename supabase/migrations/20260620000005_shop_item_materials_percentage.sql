-- =============================================================
-- shop_item_materials に percentage（素材比率 %）を追加
-- =============================================================

alter table public.shop_item_materials
  add column percentage smallint
    check (percentage between 1 and 100);

-- =============================================================
-- shop_items.sizes (text[]) → size_ids (int[])
-- =============================================================

alter table public.shop_items drop column if exists sizes;
alter table public.shop_items add column size_ids int[] not null default '{}';

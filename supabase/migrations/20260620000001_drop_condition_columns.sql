-- =============================================================
-- wishes と shop_items から condition カラムを削除
-- =============================================================

alter table public.wishes      drop column if exists condition;
alter table public.shop_items  drop column if exists condition;

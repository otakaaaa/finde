-- =============================================================
-- shop_items に価格カラムを追加
--
-- ウィッシュの「保存した検索＋新着アラート」でアイテム単位の
-- 価格マッチを行うために、アイテムごとの税込価格（円）を保持する。
-- 既存アイテムは null（価格マッチではスキップ扱い）。
-- =============================================================

alter table public.shop_items
  add column price int;

create index shop_items_price_idx on public.shop_items (price);

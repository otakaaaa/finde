-- =============================================================
-- shop_item_types 一式を削除（詳細登録 shop_items に一本化）
--
-- 背景:
--   - ライブなマッチング（notify_wishes_for_shop_item /
--     notify_on_shop_becomes_public 最新版）は shop_items を直接参照しており、
--     shop_item_types はもう読まれていない。
--   - 唯一の読み手だった get_wish_recommendations はフロントから未使用。
--   - 手動チェックボックスUI（オーナーのアイテム管理画面）も廃止。
--   よって shop_item_types テーブル・同期トリガ・未使用RPC をまとめて削除する。
-- =============================================================

-- ── 未使用 RPC を削除 ─────────────────────────────────────────
drop function if exists public.get_wish_recommendations(
  smallint, int, int, int, uuid, int
);

-- ── shop_items → shop_item_types 自動同期トリガ／関数を削除 ──────
drop trigger if exists shop_items_sync_item_type on public.shop_items;
drop function if exists public.sync_shop_item_type();

-- ── shop_item_types テーブルを削除（policy / index も連動して削除）──
drop table if exists public.shop_item_types;

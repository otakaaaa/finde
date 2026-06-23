-- =============================================================
-- 店舗バナー機能の廃止（お知らせ機能へ統合）
--   shop_banners テーブルと専用トリガ関数を削除する。
--   ※ R2 'shop-banners' 接頭辞の既存オブジェクトは別途手動削除が必要。
-- =============================================================

drop table if exists public.shop_banners cascade;

drop function if exists public.touch_shop_banner();

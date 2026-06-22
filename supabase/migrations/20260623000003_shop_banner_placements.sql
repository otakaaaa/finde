-- =============================================================
-- shop_banners: 表示位置（placements）を追加
--   'shop_detail'     = 店舗詳細ページ上部
--   'favorite_button' = 店舗詳細ページのお気に入りボタンの上
-- =============================================================

alter table public.shop_banners
  add column placements text[] not null default array['shop_detail']::text[];

-- 許可された値のみ・1件以上を保証
alter table public.shop_banners
  add constraint shop_banners_placements_valid
  check (
    placements <@ array['shop_detail', 'favorite_button']::text[]
    and array_length(placements, 1) >= 1
  );

-- placement での絞り込み用 GIN インデックス
create index shop_banners_placements_idx on public.shop_banners using gin (placements);

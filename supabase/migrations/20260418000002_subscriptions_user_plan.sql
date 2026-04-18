-- =============================================================
-- subscriptions テーブルをユーザープレミアム会員にも対応させる
-- =============================================================

-- shop_id を nullable に変更（ユーザープレミアム会員は shop_id を持たない）
alter table public.subscriptions alter column shop_id drop not null;

-- canceled_at カラムを追加
alter table public.subscriptions add column if not exists canceled_at timestamptz;

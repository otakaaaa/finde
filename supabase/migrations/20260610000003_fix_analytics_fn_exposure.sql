-- =============================================================
-- Analytics 関数の権限漏洩を修正（情報漏洩 + 改ざん）
--
-- compute_analytics_for_date(date) / upsert_analytics_snapshot(date) は
-- SECURITY DEFINER だが、PUBLIC への EXECUTE 権限（PostgreSQL の既定）が
-- 残っていた。Supabase は public スキーマの関数を PostgREST 経由で
-- anon / authenticated に公開するため、公開 anon キーだけで
--   POST /rest/v1/rpc/compute_analytics_for_date
-- を直接呼び出せた。
--
-- 影響:
--   - 管理者専用のはずの集計値（ユーザー数・店舗数・課金状況など）が
--     誰でも取得可能（analytics_daily_snapshots の admin RLS を実質的に回避。
--     SECURITY DEFINER がベーステーブルを所有者権限で直接集計するため）
--   - 任意の呼び出し元が upsert を実行し、スナップショットを改ざん/濫用可能
--
-- フロントエンドはこれらの関数を呼ばず、管理画面は
-- analytics_daily_snapshots テーブルを直接読む（admin RLS で保護済み）。
-- pg_cron ジョブはテーブル所有者ロールで実行されるため EXECUTE 権限の
-- 剥奪の影響を受けない。よって anon/authenticated からの実行のみ禁止する。
-- =============================================================

revoke all on function public.compute_analytics_for_date(date) from public;
revoke all on function public.upsert_analytics_snapshot(date) from public;

-- Supabase が既定で付与している可能性のあるロール権限も明示的に剥奪する
revoke execute on function public.compute_analytics_for_date(date) from anon, authenticated;
revoke execute on function public.upsert_analytics_snapshot(date) from anon, authenticated;

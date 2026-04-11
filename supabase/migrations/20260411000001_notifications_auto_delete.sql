-- 通知の180日自動削除設定
-- pg_cron拡張機能を使って毎日古い通知を削除するジョブをスケジュールする

-- pg_cron を有効化（Supabase ダッシュボードの Database Extensions から有効にする必要あり）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 古い通知を削除する関数
CREATE OR REPLACE FUNCTION delete_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$;

-- 毎日 UTC 03:00 に実行（重複登録を防ぐため既存ジョブを削除してから登録）
SELECT cron.unschedule('delete-expired-notifications') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-notifications'
);

SELECT cron.schedule(
  'delete-expired-notifications',
  '0 3 * * *',
  'SELECT delete_expired_notifications()'
);

-- =============================================================
-- email_templates テーブルの削除
-- メール本文を Edge Function 内に直書きする方式に移行したため不要
-- =============================================================

drop trigger if exists email_templates_updated_at on public.email_templates;
drop function if exists public.touch_email_template();
drop table if exists public.email_templates;

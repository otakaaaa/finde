-- =============================================================
-- 新規会員登録時のウェルカム通知
-- =============================================================

-- ── 1. notifications.type 制約に 'welcome' を追加 ─────────────

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'wish_match',
    'owner_application_result',
    'admin_new_listing',
    'admin_new_contact',
    'admin_review_report',
    'review_posted',
    'news_published',
    'welcome'
  ));

-- ── 2. 新規ユーザー登録時にウェルカム通知を送るトリガー ────────

CREATE OR REPLACE FUNCTION public.notify_on_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link_url, metadata)
  VALUES (
    NEW.id,
    'welcome',
    '会員登録ありがとうございます',
    'ブランドで店舗を検索したり、お気に入りに保存してみましょう。掲載されていないお店は掲載申請からリクエストできます。',
    '/shops',
    '{}'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_welcome
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_user_created();

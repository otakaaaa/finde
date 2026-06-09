-- =============================================================
-- お知らせ投稿時の全ユーザー通知
-- =============================================================

-- ── 1. notifications.type の制約に 'news_published' を追加 ───

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
    'news_published'
  ));

-- ── 2. 全ユーザーに通知を送るヘルパー関数 ────────────────────

CREATE OR REPLACE FUNCTION public.notify_all_users(
  p_type     text,
  p_title    text,
  p_body     text,
  p_link_url text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link_url, metadata)
  SELECT id, p_type, p_title, p_body, p_link_url, p_metadata
  FROM public.users;
END;
$$;

-- ── 3. press_releases 公開時に全ユーザーへ通知するトリガー ──

CREATE OR REPLACE FUNCTION public.notify_on_press_release_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- INSERT 時に published_at が設定されている、または
  -- UPDATE で published_at が NULL → 非NULL に変わった場合のみ通知
  IF (TG_OP = 'INSERT' AND new.published_at IS NOT NULL)
  OR (TG_OP = 'UPDATE' AND old.published_at IS NULL AND new.published_at IS NOT NULL)
  THEN
    PERFORM public.notify_all_users(
      'news_published',
      new.title,
      NULL,
      '/news/' || new.id::text,
      jsonb_build_object('press_release_id', new.id)
    );
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER on_press_release_publish
  AFTER INSERT OR UPDATE ON public.press_releases
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_press_release_publish();

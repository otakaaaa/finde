-- =============================================================
-- シャレ活: 通知（投稿者へシャレ度/コメントを通知）
-- =============================================================

-- 1. notification type に share_rated / share_commented を追加（既存値は保持）
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'wish_match',
    'owner_application_result',
    'admin_new_listing',
    'admin_new_contact',
    'admin_review_report',
    'review_posted',
    'news_published',
    'welcome',
    'share_rated',
    'share_commented'
  ));

-- 2. シャレ度が付いたら投稿者へ通知（自己評価は RLS/トリガで発生しないが念のため除外）
create or replace function public.notify_on_share_rating()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select
    p.user_id,
    'share_rated',
    'シャレ度がつきました',
    null,
    '/share/' || p.id,
    jsonb_build_object('post_id', p.id, 'score', new.score)
  from public.share_posts p
  where p.id = new.post_id
    and p.user_id <> new.user_id;
  return new;
end;
$$;

create trigger on_share_rating_insert_notify
  after insert on public.share_ratings
  for each row execute function public.notify_on_share_rating();

-- 3. コメントが付いたら投稿者へ通知（published のみ・自コメントは除外）
create or replace function public.notify_on_share_comment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status <> 'published' then
    return new;
  end if;
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select
    p.user_id,
    'share_commented',
    'コメントがつきました',
    substring(new.body, 1, 100),
    '/share/' || p.id,
    jsonb_build_object('post_id', p.id, 'comment_id', new.id)
  from public.share_posts p
  where p.id = new.post_id
    and p.user_id <> new.user_id;
  return new;
end;
$$;

create trigger on_share_comment_insert_notify
  after insert on public.share_comments
  for each row execute function public.notify_on_share_comment();

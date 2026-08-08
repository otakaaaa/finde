-- 店舗フォロー通知（Phase 2）
-- フォロー中の店舗がお知らせを公開したら、フォロワーへアプリ内通知を作成する。
-- 送信側（店舗）・受信側（ユーザー）双方のチャネル別設定を用意する。
-- メール配信自体は Phase 3（Edge Function）で実装し、本マイグレーションでは
-- 送受信フラグの器のみ用意する。
-- 参照: docs/design/shop-follow.md

-- =============================================================
-- 1. notifications.type に新種別を追加
-- =============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'wish_match',
    'owner_application_result',
    'admin_new_listing',
    'admin_new_contact',
    'news_published',
    'welcome',
    'share_rated',
    'share_commented',
    'followed_shop_announcement'
  ));

-- =============================================================
-- 2. 店舗側: お知らせごとのチャネル別送信フラグ
-- =============================================================

alter table public.shop_announcements
  add column notify_in_app boolean not null default true,
  add column notify_email  boolean not null default false;

-- =============================================================
-- 3. ユーザー側: チャネル別受信設定
--    行が無いユーザーは既定値（両方ON）として扱う
-- =============================================================

create table public.user_notification_settings (
  user_id              uuid primary key references public.users(id) on delete cascade,
  followed_shop_in_app boolean not null default true,
  followed_shop_email  boolean not null default true,
  updated_at           timestamptz not null default now()
);

alter table public.user_notification_settings enable row level security;

create policy "user_notification_settings: self read"
  on public.user_notification_settings for select
  using (auth.uid() = user_id);

create policy "user_notification_settings: self write"
  on public.user_notification_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================
-- 4. お知らせ公開時にフォロワーへアプリ内通知を作成するトリガー
--    配信条件 = 店舗の送信設定 AND ユーザーの受信設定（未設定は ON 扱い）
--    update での再通知はしない（スパム防止）
-- =============================================================

create or replace function public.notify_shop_followers()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.is_active and new.notify_in_app then
    insert into public.notifications (user_id, type, title, body, link_url)
    select f.user_id,
           'followed_shop_announcement',
           s.name || ' からのお知らせ',
           new.title,
           '/shops/' || new.shop_id::text
    from public.shop_follows f
    join public.shops s on s.id = new.shop_id
    left join public.user_notification_settings ns on ns.user_id = f.user_id
    where f.shop_id = new.shop_id
      and coalesce(ns.followed_shop_in_app, true);
  end if;
  return new;
end;
$$;

create trigger on_shop_announcement_created
  after insert on public.shop_announcements
  for each row execute function public.notify_shop_followers();

-- =============================================================
-- notifications
-- サイト内通知テーブル
-- =============================================================

create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  type       text        not null check (type in (
    'wish_match',
    'owner_application_result',
    'admin_new_listing',
    'admin_new_contact',
    'admin_review_report',
    'review_posted'
  )),
  title      text        not null,
  body       text,
  link_url   text,
  metadata   jsonb       not null default '{}',
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

-- ログインユーザーは自分の通知のみ読める
create policy "notifications: self read"
  on public.notifications for select
  using (auth.uid() = user_id);

-- ログインユーザーは自分の通知を既読にできる（他フィールドの更新も技術的には可能だが、
-- フロントエンドは is_read のみ更新するよう実装する）
create policy "notifications: self update"
  on public.notifications for update
  using (auth.uid() = user_id);

-- 自分の通知を削除できる（将来用）
create policy "notifications: self delete"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- INSERT は SECURITY DEFINER のトリガー関数からのみ（一般ユーザーは不可）

-- Supabase Realtime を有効化
alter publication supabase_realtime add table public.notifications;

-- =============================================================
-- Helper: 管理者全員に通知を送る
-- =============================================================

create or replace function public.notify_admins(
  p_type     text,
  p_title    text,
  p_body     text,
  p_link_url text,
  p_metadata jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select id, p_type, p_title, p_body, p_link_url, p_metadata
  from public.users
  where role = 'admin';
end;
$$;

-- =============================================================
-- Trigger: レビュー投稿 → 店舗オーナーに通知
-- =============================================================

create or replace function public.notify_on_review_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select
    ss.user_id,
    'review_posted',
    'レビューが投稿されました',
    substring(new.body, 1, 100),
    '/owner',
    jsonb_build_object('shop_id', new.shop_id, 'review_id', new.id)
  from public.shop_staffs ss
  where ss.shop_id = new.shop_id
    and ss.user_id <> new.user_id;  -- レビュー投稿者自身には送らない
  return new;
end;
$$;

create trigger on_review_insert_notify_owner
  after insert on public.reviews
  for each row execute function public.notify_on_review_insert();

-- =============================================================
-- Trigger: 掲載申請のステータス変更 → 申請者に通知
-- =============================================================

create or replace function public.notify_on_listing_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'pending' and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, type, title, body, link_url, metadata)
    values (
      new.submitted_by,
      'owner_application_result',
      case
        when new.status = 'approved' then '申請が承認されました'
        else '申請が却下されました'
      end,
      case
        when new.status = 'approved' then 'オーナーダッシュボードから店舗を管理できます'
        else '詳細についてはお問い合わせください'
      end,
      case
        when new.status = 'approved' then '/owner'
        else '/mypage'
      end,
      jsonb_build_object('request_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger on_listing_request_status_change
  after update on public.shop_listing_requests
  for each row execute function public.notify_on_listing_request_status_change();

-- =============================================================
-- Trigger: 新規掲載申請 → 管理者に通知
-- =============================================================

create or replace function public.notify_admins_on_new_listing_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_admins(
    'admin_new_listing',
    '新規掲載申請が届きました',
    new.shop_name || ' の申請が届いています',
    '/admin/applications',
    jsonb_build_object('request_id', new.id, 'is_owner_request', new.is_owner_request)
  );
  return new;
end;
$$;

create trigger on_listing_request_insert_notify_admin
  after insert on public.shop_listing_requests
  for each row execute function public.notify_admins_on_new_listing_request();

-- =============================================================
-- Trigger: 新規お問い合わせ → 管理者に通知
-- =============================================================

create or replace function public.notify_admins_on_new_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_admins(
    'admin_new_contact',
    '新しいお問い合わせが届きました',
    coalesce(new.subject, 'お問い合わせ') || ' — ' || new.name,
    '/admin/contacts',
    jsonb_build_object('inquiry_id', new.id)
  );
  return new;
end;
$$;

create trigger on_contact_insert_notify_admin
  after insert on public.contact_inquiries
  for each row execute function public.notify_admins_on_new_contact();

-- =============================================================
-- Trigger: レビュー通報 → 管理者に通知
-- =============================================================

create or replace function public.notify_admins_on_review_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify_admins(
    'admin_review_report',
    'レビューが通報されました',
    '通報されたレビューの確認が必要です',
    '/admin/reviews',
    jsonb_build_object('review_id', new.review_id, 'report_id', new.id)
  );
  return new;
end;
$$;

create trigger on_review_report_insert_notify_admin
  after insert on public.review_reports
  for each row execute function public.notify_admins_on_review_report();

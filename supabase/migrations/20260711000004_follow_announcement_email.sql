-- 店舗フォロー通知 Phase 3: メール配信
-- お知らせ公開時、メール送信ONかつ受信ONのフォロワーへ Edge Function 経由でメールを送る。
-- 頻度キャップ: 同一店舗からのメールは1日1通まで（JST）。
-- 参照: docs/design/shop-follow.md

-- =============================================================
-- 1. メール送信履歴（頻度キャップ用）
--    unique(shop_id, sent_on) により同一店舗・同一日の二重送信を防ぐ。
--    service role のみが書き込む（RLS有効・ポリシーなし = クライアント全拒否）
-- =============================================================

create table public.follow_email_log (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  announcement_id uuid not null references public.shop_announcements(id) on delete cascade,
  sent_on         date not null,
  created_at      timestamptz not null default now(),
  unique (shop_id, sent_on)
);

alter table public.follow_email_log enable row level security;

-- =============================================================
-- 2. notify_shop_followers を再作成し、メール配信の起動を追加
--    配信条件:
--      店舗の notify_email = true
--      AND 受信ONのフォロワーが1人以上
--      AND 当日（JST）まだこの店舗からメールを送っていない
-- =============================================================

create or replace function public.notify_shop_followers()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_email_count   int;
  v_log_inserted  int;
  v_supabase_url  text;
  v_service_key   text;
begin
  -- ── アプリ内通知 ─────────────────────────────
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

  -- ── メール配信（Edge Function 起動） ─────────────
  if new.is_active and new.notify_email then
    -- 受信ONのフォロワーが存在するか
    select count(*) into v_email_count
    from public.shop_follows f
    left join public.user_notification_settings ns on ns.user_id = f.user_id
    where f.shop_id = new.shop_id
      and coalesce(ns.followed_shop_email, true);

    if v_email_count > 0 then
      -- 頻度キャップ: 同一店舗は1日1通（JST）。挿入できた場合のみ送信する。
      insert into public.follow_email_log (shop_id, announcement_id, sent_on)
      values (new.shop_id, new.id, (now() at time zone 'Asia/Tokyo')::date)
      on conflict (shop_id, sent_on) do nothing;
      get diagnostics v_log_inserted = row_count;

      if v_log_inserted > 0 then
        -- Vault からシークレットを取得（本関数のみ復号可能）
        select decrypted_secret into v_supabase_url
        from vault.decrypted_secrets where name = 'project_url' limit 1;
        select decrypted_secret into v_service_key
        from vault.decrypted_secrets where name = 'service_role_key' limit 1;

        -- 未設定環境では安全にスキップ（アプリ内通知は作成済み）
        if v_supabase_url is not null and v_service_key is not null then
          perform net.http_post(
            url     := v_supabase_url || '/functions/v1/send-follow-announcement-email',
            headers := jsonb_build_object(
              'Content-Type',  'application/json',
              'Authorization', 'Bearer ' || v_service_key
            ),
            body    := jsonb_build_object('announcement_id', new.id)
          );
        end if;
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- トリガー自体は 20260711000003 で作成済み（関数の再作成のみで反映される）

-- =============================================================
-- URL スキームのサーバー側ガード（格納型XSSの多層防御）
--
-- クライアントの zod（optionalHttpUrlSchema）は http/https のみ許可するが、
-- SECURITY DEFINER RPC（update_shop_as_owner 等）や管理者の直接更新、
-- 出店申請の承認経路（approve_listing_request が website_url 等をコピー）を
-- 直接叩けば javascript: 等のスキームを保存できてしまう。
-- 表示側は safeExternalHref で無害化済みだが、データ層でも保存を拒否する。
--
-- 対象列（いずれも <a href> に描画され得る外部URL）:
--   shops.website_url / instagram_url / twitter_url / tiktok_url
--   shop_listing_requests.website_url / instagram_url / twitter_url / tiktok_url
--   shop_announcements.link_url
-- =============================================================

-- null・空文字は許可（任意項目）。値がある場合のみ http/https を必須とする。
-- Postgres に URL パーサはないため正規表現で判定する（制御文字・空白を排除）。
create or replace function public.is_safe_http_url(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_url is null
      or p_url = ''
      or p_url ~* '^https?://[^[:space:][:cntrl:]]+$';
$$;

-- ── 既存データのクリーンアップ（不正スキームは null 化）──────────
update public.shops set website_url   = null where website_url   is not null and not public.is_safe_http_url(website_url);
update public.shops set instagram_url = null where instagram_url is not null and not public.is_safe_http_url(instagram_url);
update public.shops set twitter_url   = null where twitter_url   is not null and not public.is_safe_http_url(twitter_url);
update public.shops set tiktok_url    = null where tiktok_url    is not null and not public.is_safe_http_url(tiktok_url);

update public.shop_listing_requests set website_url   = null where website_url   is not null and not public.is_safe_http_url(website_url);
update public.shop_listing_requests set instagram_url = null where instagram_url is not null and not public.is_safe_http_url(instagram_url);
update public.shop_listing_requests set twitter_url   = null where twitter_url   is not null and not public.is_safe_http_url(twitter_url);
update public.shop_listing_requests set tiktok_url    = null where tiktok_url    is not null and not public.is_safe_http_url(tiktok_url);

update public.shop_announcements set link_url = null where link_url is not null and not public.is_safe_http_url(link_url);

-- ── CHECK 制約（全書き込み経路をデータ層で一括ガード）──────────
alter table public.shops
  add constraint shops_website_url_scheme_chk   check (public.is_safe_http_url(website_url)),
  add constraint shops_instagram_url_scheme_chk check (public.is_safe_http_url(instagram_url)),
  add constraint shops_twitter_url_scheme_chk   check (public.is_safe_http_url(twitter_url)),
  add constraint shops_tiktok_url_scheme_chk    check (public.is_safe_http_url(tiktok_url));

alter table public.shop_listing_requests
  add constraint slr_website_url_scheme_chk   check (public.is_safe_http_url(website_url)),
  add constraint slr_instagram_url_scheme_chk check (public.is_safe_http_url(instagram_url)),
  add constraint slr_twitter_url_scheme_chk   check (public.is_safe_http_url(twitter_url)),
  add constraint slr_tiktok_url_scheme_chk    check (public.is_safe_http_url(tiktok_url));

alter table public.shop_announcements
  add constraint shop_announcements_link_url_scheme_chk check (public.is_safe_http_url(link_url));

-- =============================================================
-- email_templates
-- アプリが自動送信するメールのテンプレートを管理するテーブル
-- =============================================================

create table public.email_templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  subject     text not null,
  body        text not null,
  is_active   boolean not null default true,
  variables   text[] not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id) on delete set null
);

-- 管理者のみ参照・更新可
create policy "email_templates: admin read"
  on public.email_templates for select
  using (public.is_admin());

create policy "email_templates: admin update"
  on public.email_templates for update
  using (public.is_admin());

alter table public.email_templates enable row level security;

-- updated_at 自動更新
create or replace function public.touch_email_template()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.touch_email_template();

-- =============================================================
-- シードデータ
-- =============================================================

insert into public.email_templates (slug, name, subject, body, is_active, variables) values

('welcome',
 '新規登録完了',
 '【FINDE】ご登録ありがとうございます',
 '{{display_name}} 様

この度はFINDEにご登録いただきありがとうございます。

■ アカウント情報
・メールアドレス: {{email}}
・登録日時: {{created_at}}

FINDEでは、あなたのお気に入りの古着屋を見つけることができます。
ぜひウィッシュリストや店舗検索をご活用ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

FINDE運営チーム
https://finde.example.com',
true,
ARRAY['display_name', 'email', 'created_at']),

('email_confirmation',
 'メールアドレス確認',
 '【FINDE】メールアドレスをご確認ください',
 '{{display_name}} 様

FINDEのご登録ありがとうございます。
以下のリンクをクリックしてメールアドレスを確認してください。

■ 確認リンク
{{confirmation_url}}

このリンクは {{expires_at}} まで有効です。

※このメールに心当たりがない場合は破棄してください。

FINDE運営チーム',
true,
ARRAY['display_name', 'confirmation_url', 'expires_at']),

('password_reset',
 'パスワードリセット',
 '【FINDE】パスワードリセットのご案内',
 '{{display_name}} 様

パスワードリセットのリクエストを受け付けました。
以下のリンクよりパスワードを再設定してください。

■ パスワード再設定リンク
{{reset_url}}

このリンクは {{expires_at}} まで有効です。

※パスワードリセットをリクエストしていない場合は、このメールを無視してください。
　アカウントへの不正アクセスの恐れがある場合はお問い合わせください。

FINDE運営チーム',
true,
ARRAY['display_name', 'reset_url', 'expires_at']),

('listing_approved',
 '掲載申請承認',
 '【FINDE】店舗掲載申請が承認されました',
 '{{display_name}} 様

ご申請いただいた店舗の掲載が承認されました。

■ 承認内容
・店舗名: {{shop_name}}
・承認日時: {{approved_at}}

オーナーダッシュボードから店舗情報の編集や写真の追加が行えます。
{{dashboard_url}}

引き続きFINDEをよろしくお願いいたします。

FINDE運営チーム',
true,
ARRAY['display_name', 'shop_name', 'approved_at', 'dashboard_url']),

('listing_rejected',
 '掲載申請却下',
 '【FINDE】店舗掲載申請について',
 '{{display_name}} 様

ご申請いただいた「{{shop_name}}」の掲載申請について、
今回は掲載の承認が難しい状況となりました。

■ 理由
{{rejection_reason}}

内容を修正の上、再度申請いただくことも可能です。
ご不明な点はお問い合わせよりご連絡ください。

FINDE運営チーム',
true,
ARRAY['display_name', 'shop_name', 'rejection_reason']),

('contact_received',
 'お問い合わせ受付確認',
 '【FINDE】お問い合わせを受け付けました',
 '{{name}} 様

この度はFINDEへお問い合わせいただきありがとうございます。
以下の内容でお問い合わせを受け付けました。

■ お問い合わせ内容
・件名: {{subject}}
・カテゴリ: {{category}}
・受付日時: {{received_at}}

内容を確認の上、担当者よりご連絡いたします。
{{#unless is_noreply}}
返信までに数日お時間をいただく場合がございます。
{{/unless}}

FINDE運営チーム
https://finde.example.com',
true,
ARRAY['name', 'subject', 'category', 'received_at', 'is_noreply']);

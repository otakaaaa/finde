-- =============================================================
-- email_templates に掲載申請受付確認テンプレートを追加
-- =============================================================

insert into public.email_templates (slug, name, subject, body, is_active, variables) values
(
  'listing_request_received',
  '掲載申請受付確認',
  '【フクナビ】店舗掲載申請を受け付けました',
  '{{display_name}} 様

この度はフクナビへ店舗掲載申請をいただきありがとうございます。
以下の内容で申請を受け付けました。

■ 申請内容
・店舗名: {{shop_name}}
・申請日時: {{submitted_at}}

フクナビ運営が内容を確認の上、審査完了後にメールにてご連絡いたします。
通常2〜5営業日程度お時間をいただきます。

ご不明な点がございましたら、お問い合わせよりご連絡ください。

フクナビ運営チーム',
  true,
  ARRAY['display_name', 'shop_name', 'submitted_at']
);

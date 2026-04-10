-- =============================================================
-- テーブル名の変更
--   contact_inquiries → contacts
--   inquiry_replies   → contact_replies
--
-- RLS ポリシー・トリガー・インデックスは OID で紐づくため
-- テーブル名変更後も自動的に追従する。
-- =============================================================

alter table public.contact_inquiries rename to contacts;
alter table public.inquiry_replies   rename to contact_replies;

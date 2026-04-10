-- =============================================================
-- contact_replies.inquiry_id → contact_id にカラム名変更
-- =============================================================

alter table public.contact_replies rename column inquiry_id to contact_id;

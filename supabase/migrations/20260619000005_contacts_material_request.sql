-- =============================================================
-- contacts.category に material_request を追加
-- =============================================================

-- テーブル名変更前の制約名が残っているため旧名で drop する
alter table public.contacts
  drop constraint if exists contact_inquiries_category_check;

alter table public.contacts
  add constraint contacts_category_check
    check (category in (
      'general',
      'shop_listing',
      'bug_report',
      'account',
      'other',
      'material_request'
    ));

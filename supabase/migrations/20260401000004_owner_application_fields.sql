-- =============================================================
-- オーナー申請用フィールドを shop_listing_requests に追加
-- =============================================================

alter table public.shop_listing_requests
  add column applicant_name    text,                              -- 申請者氏名
  add column applicant_phone   text,                              -- 電話番号（本人確認用）
  add column applicant_role    text                               -- 店舗との関係
                                 check (applicant_role in ('owner', 'manager')),
  add column instagram_handle  text,                              -- Instagram @handle
  add column existing_shop_id  uuid                               -- 既存店舗を選択した場合
                                 references public.shops(id) on delete set null;

-- 既存店舗の選択は公開店舗から（ユーザーが閲覧できる範囲）
-- RLS は既存ポリシーを流用（submitted_by = auth.uid() or is_admin()）

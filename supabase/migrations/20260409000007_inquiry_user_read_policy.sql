-- =============================================================
-- contact_inquiries: ログインユーザーが自分のお問い合わせを読めるポリシーを追加
-- 既存の admin 向け SELECT ポリシーは残す（Supabase は複数 SELECT ポリシーを OR 結合）
-- =============================================================

create policy "contact_inquiries: self read"
  on public.contact_inquiries for select
  using (auth.uid() = user_id);

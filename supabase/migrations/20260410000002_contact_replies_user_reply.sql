-- =============================================================
-- contact_replies に is_admin_reply カラムを追加
-- 既存レコードは管理者返信として扱う
-- =============================================================

alter table public.contact_replies
  add column if not exists is_admin_reply boolean not null default false;

-- 既存レコードは管理者が送ったものなので true に設定
update public.contact_replies set is_admin_reply = true;

-- ユーザーが自分のお問い合わせに返信できるポリシーを追加
create policy "contact_replies: self insert"
  on public.contact_replies for insert
  with check (
    auth.uid() = replied_by
    and is_admin_reply = false
    and exists (
      select 1 from public.contacts c
      where c.id = contact_id and c.user_id = auth.uid()
    )
  );

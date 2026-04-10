-- =============================================================
-- inquiry_replies
-- 管理者がお問い合わせに返信を保存するテーブル
-- =============================================================

create table public.inquiry_replies (
  id          uuid        primary key default gen_random_uuid(),
  inquiry_id  uuid        not null references public.contact_inquiries(id) on delete cascade,
  body        text        not null,
  replied_by  uuid        not null references public.users(id),
  created_at  timestamptz not null default now()
);

create index inquiry_replies_inquiry_idx on public.inquiry_replies (inquiry_id, created_at);

alter table public.inquiry_replies enable row level security;

-- 管理者は全件読める
create policy "inquiry_replies: admin read"
  on public.inquiry_replies for select
  using (public.is_admin());

-- ユーザーは自分のお問い合わせに紐づく返信のみ読める
create policy "inquiry_replies: self read"
  on public.inquiry_replies for select
  using (
    exists (
      select 1 from public.contact_inquiries c
      where c.id = inquiry_id and c.user_id = auth.uid()
    )
  );

-- 管理者のみ返信を作成できる
create policy "inquiry_replies: admin insert"
  on public.inquiry_replies for insert
  with check (public.is_admin());

-- 管理者のみ返信を削除できる
create policy "inquiry_replies: admin delete"
  on public.inquiry_replies for delete
  using (public.is_admin());

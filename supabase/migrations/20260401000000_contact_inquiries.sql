-- =============================================================
-- contact_inquiries
-- =============================================================

create table public.contact_inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  category    text not null
                check (category in ('general', 'shop_listing', 'bug_report', 'account', 'other')),
  subject     text not null,
  body        text not null,
  status      text not null default 'open'
                check (status in ('open', 'in_progress', 'closed')),
  user_id     uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Anyone (including anonymous) can submit an inquiry
create policy "contact_inquiries: anyone insert"
  on public.contact_inquiries for insert
  with check (true);

-- Only admins can view inquiries
create policy "contact_inquiries: admin read"
  on public.contact_inquiries for select
  using (public.is_admin());

-- Only admins can update status
create policy "contact_inquiries: admin update"
  on public.contact_inquiries for update
  using (public.is_admin());

alter table public.contact_inquiries enable row level security;

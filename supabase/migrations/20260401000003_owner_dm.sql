-- =============================================================
-- owner_dm_messages
-- オーナー申請の審査DM（ユーザー ⇔ 管理者）
-- =============================================================

create table public.owner_dm_messages (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.shop_listing_requests(id) on delete cascade,
  sender_id  uuid not null references public.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- 申請者本人または管理者が読める
create policy "owner_dm_messages: self and admin read"
  on public.owner_dm_messages for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.shop_listing_requests r
      where r.id = request_id and r.submitted_by = auth.uid()
    )
  );

-- 申請者本人または管理者が投稿できる
create policy "owner_dm_messages: self and admin insert"
  on public.owner_dm_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.shop_listing_requests r
        where r.id = request_id and r.submitted_by = auth.uid()
      )
    )
  );

alter table public.owner_dm_messages enable row level security;

-- =============================================================
-- approve_owner_application(p_request_id)
-- 管理者がオーナー申請を承認し、ユーザーを shop_owner に昇格
-- =============================================================

create or replace function public.approve_owner_application(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select submitted_by into v_user_id
  from public.shop_listing_requests
  where id = p_request_id;

  if v_user_id is null then
    raise exception 'Application not found';
  end if;

  -- 申請ステータスを承認に更新
  update public.shop_listing_requests
  set status = 'approved', updated_at = now()
  where id = p_request_id;

  -- ユーザーロールを shop_owner に昇格
  update public.users
  set role = 'shop_owner', updated_at = now()
  where id = v_user_id;
end;
$$;

revoke all on function public.approve_owner_application(uuid) from public;
grant execute on function public.approve_owner_application(uuid) to authenticated;

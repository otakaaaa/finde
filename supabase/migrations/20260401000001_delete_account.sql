-- =============================================================
-- delete_own_account()
-- 認証済みユーザーが自分のアカウントを完全削除するための RPC
-- SECURITY DEFINER で実行し、auth.users を削除（public.users は CASCADE）
-- =============================================================

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 未認証の呼び出しを拒否
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- auth.users を削除 → public.users へ CASCADE DELETE
  delete from auth.users where id = auth.uid();
end;
$$;

-- public ロールからは実行不可にし、authenticated のみ許可
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

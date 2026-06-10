-- =============================================================
-- 権限昇格の修正: ユーザーが自分の role を変更できないようにする
--
-- 20260404000000_fix_users_self_update_policy.sql は WITH CHECK の
-- 無限再帰を回避するため role ガードを削除し、
--   with check (id = auth.uid())
-- だけにしていた。この結果、任意の認証ユーザーが自分の users 行に対して
--   update users set role = 'admin' where id = auth.uid()
-- を実行でき、is_admin() が true になって全管理機能を掌握できる状態だった。
--
-- 再帰の原因は、ポリシーの WITH CHECK 内で public.users を直接参照すると
-- 同じ UPDATE 評価中に users の RLS が再入する点にあった。
-- is_admin() と同様、SECURITY DEFINER 関数（テーブル所有者として実行され
-- RLS をバイパスする）でロールを取得すれば再帰せずに保護できる。
-- =============================================================

-- 自分の現在の role を RLS 再帰なしで取得するヘルパー
create or replace function public.current_app_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select role from public.users where id = auth.uid()
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

-- 自己更新: id / role は変更不可（プロフィール項目のみ更新可）
drop policy if exists "users: self update" on public.users;
create policy "users: self update" on public.users
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_app_role()
  );

-- 管理者のみ任意ユーザーの role を変更可能（AdminUsersPage 用）
drop policy if exists "users: admin update" on public.users;
create policy "users: admin update" on public.users
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Fix infinite recursion on public.users update policy.
-- The previous WITH CHECK queried public.users again, which re-entered RLS.

drop policy if exists "users: self update" on public.users;

create policy "users: self update" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

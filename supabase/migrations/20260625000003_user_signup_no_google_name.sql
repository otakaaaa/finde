-- =============================================================
-- 新規登録時に Google アカウント名を初期値として使わない
-- display_name は NULL のままにして、ユーザー本人に入力させる
-- （avatar_url は従来どおり Google のものを初期値として利用）
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.users (id, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

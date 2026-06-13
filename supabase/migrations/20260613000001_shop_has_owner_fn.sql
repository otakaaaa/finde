-- 店舗にオーナー(shop_staffs.staff_role = 'owner')が紐づいているかを返すヘルパー。
-- shop_staffs の RLS では本人 / 管理者しか行を読めないため、店舗詳細画面の
-- 「この店舗のオーナーですか？」CTA の表示制御には SECURITY DEFINER 関数を使う。
-- 返すのは真偽値のみで、オーナーの個人情報は一切公開しない。
create or replace function public.shop_has_owner(p_shop_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists(
    select 1
    from public.shop_staffs ss
    where ss.shop_id = p_shop_id
      and ss.staff_role = 'owner'
  )
$$;

-- 未ログインの閲覧者でも CTA の表示制御が必要なため anon / authenticated に EXECUTE を付与する
revoke all on function public.shop_has_owner(uuid) from public;
grant execute on function public.shop_has_owner(uuid) to anon, authenticated;

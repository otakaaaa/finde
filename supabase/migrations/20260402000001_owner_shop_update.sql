-- =============================================================
-- オーナーが自店舗の編集可能フィールドを更新できる RPC
-- （RLS では admin のみ UPDATE 可だが、SECURITY DEFINER で権限昇格）
-- =============================================================

create or replace function public.update_own_shop(
  p_shop_id      uuid,
  p_description  text     default null,
  p_phone        text     default null,
  p_website_url  text     default null,
  p_instagram_url text    default null,
  p_twitter_url  text     default null,
  p_business_hours jsonb  default null,
  p_closed_days  text[]   default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 呼び出し者が対象店舗のスタッフであることを確認
  if not exists (
    select 1 from public.shop_staffs
    where shop_id = p_shop_id
      and user_id = auth.uid()
  ) then
    raise exception 'Forbidden: not a staff of this shop';
  end if;

  update public.shops
  set
    description    = p_description,
    phone          = p_phone,
    website_url    = p_website_url,
    instagram_url  = p_instagram_url,
    twitter_url    = p_twitter_url,
    business_hours = p_business_hours,
    closed_days    = coalesce(p_closed_days, '{}'),
    updated_at     = now()
  where id = p_shop_id;
end;
$$;

-- 認証済みユーザーのみ実行可
revoke all on function public.update_own_shop(uuid, text, text, text, text, text, jsonb, text[]) from public;
grant execute on function public.update_own_shop(uuid, text, text, text, text, text, jsonb, text[]) to authenticated;

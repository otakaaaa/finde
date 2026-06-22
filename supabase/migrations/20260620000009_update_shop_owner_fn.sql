-- =============================================================
-- オーナーによる店舗情報更新を SECURITY DEFINER RPC で実装
--
-- shops: owner update (RLS USING 句) が環境によって 0 行を返す問題の回避。
-- SECURITY DEFINER で実行することで RLS を経由せず shop_staffs を直接チェックし、
-- 確実に権限検証と更新を行う。
-- status は意図的に除外（管理者のみ変更可）。
-- =============================================================

create or replace function public.update_shop_as_owner(
  p_shop_id        uuid,
  p_name           text      default null,
  p_description    text      default null,
  p_prefecture_id  smallint  default null,
  p_city_id        int       default null,
  p_address        text      default null,
  p_price_range_id int       default null,
  p_phone          text      default null,
  p_website_url    text      default null,
  p_instagram_url  text      default null,
  p_twitter_url    text      default null,
  p_tiktok_url     text      default null,
  p_business_hours jsonb     default null,
  p_closed_days    text[]    default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 呼び出し者が対象店舗のスタッフであることを確認（RLS バイパスで直接チェック）
  if not exists (
    select 1 from public.shop_staffs
    where shop_id = p_shop_id
      and user_id = auth.uid()
  ) then
    raise exception 'Forbidden: not a staff of this shop';
  end if;

  update public.shops
  set
    name            = coalesce(p_name, name),
    description     = p_description,
    prefecture_id   = p_prefecture_id,
    city_id         = p_city_id,
    -- area_id（旧テーブル）を prefecture_id / city_id と同期する
    -- areas.prefecture = prefectures.name かつ areas.city = cities.name で一致するレコードを探す
    area_id         = (
      select a.id
      from public.areas a
      join public.prefectures pref on pref.name = a.prefecture
      join public.cities c        on c.name = a.city and c.prefecture_id = pref.id
      where pref.id = p_prefecture_id
        and c.id    = p_city_id
      limit 1
    ),
    address         = p_address,
    price_range_id  = p_price_range_id,
    phone           = p_phone,
    website_url     = p_website_url,
    instagram_url   = p_instagram_url,
    twitter_url     = p_twitter_url,
    tiktok_url      = p_tiktok_url,
    business_hours  = p_business_hours,
    closed_days     = coalesce(p_closed_days, '{}'),
    updated_at      = now()
  where id = p_shop_id;

  return p_shop_id;
end;
$$;

revoke all on function public.update_shop_as_owner(uuid, text, text, smallint, int, text, int, text, text, text, text, text, jsonb, text[]) from public;
grant execute on function public.update_shop_as_owner(uuid, text, text, smallint, int, text, int, text, text, text, text, text, jsonb, text[]) to authenticated;

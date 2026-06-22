-- =============================================================
-- get_shop_wish_analytics を prefecture_id ベースに修正
--
-- wishes.area_id 廃止（20260620000010）により、本 RPC が参照していた
-- w.area_id / areas join が壊れたため、shops.prefecture_id と
-- wishes.prefecture_id の直接一致に置き換える。
-- =============================================================

create or replace function public.get_shop_wish_analytics(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefecture_id smallint;
  v_result        jsonb;
begin
  -- 権限チェック: オーナーまたは管理者のみ
  if not exists (
    select 1 from public.shop_staffs where shop_id = p_shop_id and user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  -- 店舗の都道府県を取得
  select prefecture_id into v_prefecture_id from public.shops where id = p_shop_id;

  select jsonb_build_object(
    -- 都道府県内の公開ウィッシュ合計
    'total_matching_wishes', (
      select count(*)
      from public.wishes w
      where w.is_public = true and w.status = 'active'
        and w.prefecture_id = v_prefecture_id
    ),
    -- カテゴリ別ウィッシュ数
    'by_item_category', (
      select coalesce(jsonb_agg(row order by cnt desc), '[]'::jsonb)
      from (
        select jsonb_build_object('id', ic.id, 'name', ic.name, 'count', count(*)) as row,
               count(*) as cnt
        from public.wishes w
        join public.item_categories ic on ic.id = w.item_category_id
        where w.is_public = true and w.status = 'active'
          and w.prefecture_id = v_prefecture_id
        group by ic.id, ic.name
        order by cnt desc
        limit 10
      ) sub
    ),
    -- ブランド需要ランキング（ショップにあるかどうか付き）
    'top_demanded_brands', (
      select coalesce(jsonb_agg(row order by cnt desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'brand_id', w.brand_id,
          'name', b.name,
          'count', count(*),
          'in_shop', exists (
            select 1 from public.shop_brands sb
            where sb.shop_id = p_shop_id and sb.brand_id = w.brand_id
          )
        ) as row,
        count(*) as cnt
        from public.wishes w
        join public.brands b on b.id = w.brand_id
        where w.is_public = true and w.status = 'active'
          and w.prefecture_id = v_prefecture_id
          and w.brand_id is not null
        group by w.brand_id, b.name
        order by cnt desc
        limit 10
      ) sub
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_shop_wish_analytics(uuid) from public;
grant execute on function public.get_shop_wish_analytics(uuid) to authenticated;

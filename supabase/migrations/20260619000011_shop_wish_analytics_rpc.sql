-- =============================================================
-- get_shop_wish_analytics: オーナー向けウィッシュマッチ分析
-- SECURITY DEFINER で全ウィッシュを集計（個別データは返さない）
-- 呼び出し元が当該店舗のオーナーまたは管理者であることを確認する
-- =============================================================

create or replace function public.get_shop_wish_analytics(p_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_area_id    int;
  v_prefecture text;
  v_result     jsonb;
begin
  -- 権限チェック: オーナーまたは管理者のみ
  if not exists (
    select 1 from public.shop_staffs where shop_id = p_shop_id and user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'Unauthorized';
  end if;

  -- 店舗のエリア情報を取得
  select area_id into v_area_id from public.shops where id = p_shop_id;
  select prefecture into v_prefecture from public.areas where id = v_area_id;

  select jsonb_build_object(
    -- 都道府県内の公開ウィッシュ合計
    'total_matching_wishes', (
      select count(*)
      from public.wishes w
      join public.areas a on a.id = w.area_id
      where w.is_public = true and w.status = 'active'
        and a.prefecture = v_prefecture
    ),
    -- カテゴリ別ウィッシュ数
    'by_item_category', (
      select coalesce(jsonb_agg(row order by cnt desc), '[]'::jsonb)
      from (
        select jsonb_build_object('id', ic.id, 'name', ic.name, 'count', count(*)) as row,
               count(*) as cnt
        from public.wishes w
        join public.areas a  on a.id  = w.area_id
        join public.item_categories ic on ic.id = w.item_category_id
        where w.is_public = true and w.status = 'active'
          and a.prefecture = v_prefecture
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
        join public.areas  a on a.id  = w.area_id
        join public.brands b on b.id  = w.brand_id
        where w.is_public = true and w.status = 'active'
          and a.prefecture = v_prefecture
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

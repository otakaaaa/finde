-- =============================================================
-- get_wish_recommendations: 5軸スコアリングに更新
-- スコア: アイテムタイプ一致+3 / ブランド一致+3 /
--         アイテムカテゴリ一致+2 / 価格帯一致+2 / 同市区町村+1
-- エリア（都道府県）は必須フィルタ
-- =============================================================

create or replace function public.get_wish_recommendations(
  p_area_id          int,
  p_item_type_id     int  default null,
  p_item_category_id int  default null,
  p_brand_id         uuid default null,
  p_price_range_id   int  default null
)
returns table (shop_id uuid, score int)
language sql stable
set search_path = ''
as $$
  with pref_area_ids as (
    select a.id
    from public.areas a
    where a.prefecture = (
      select prefecture from public.areas where id = p_area_id
    )
  ),
  item_type_shops as (
    select sit.shop_id
    from public.shop_item_types sit
    where p_item_type_id is not null
      and sit.item_type_id = p_item_type_id
  ),
  item_category_shops as (
    select sit.shop_id
    from public.shop_item_types sit
    join public.item_types it on it.id = sit.item_type_id
    where p_item_category_id is not null
      and it.item_category_id = p_item_category_id
  ),
  brand_shops as (
    select sb.shop_id
    from public.shop_brands sb
    where p_brand_id is not null
      and sb.brand_id = p_brand_id
  )
  select
    s.id as shop_id,
    (
      case when exists (select 1 from item_type_shops     where shop_id = s.id) then 3 else 0 end +
      case when exists (select 1 from brand_shops         where shop_id = s.id) then 3 else 0 end +
      case when exists (select 1 from item_category_shops where shop_id = s.id) then 2 else 0 end +
      case when s.price_range_id = p_price_range_id                             then 2 else 0 end +
      case when s.area_id = p_area_id                                           then 1 else 0 end
    ) as score
  from public.shops s
  where s.status = 'public'
    and s.area_id in (select id from pref_area_ids)
  order by score desc
  limit 20;
$$;

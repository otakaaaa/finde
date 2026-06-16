-- search_shops: 検索結果に完全なショップデータを含めるよう関数を拡張
-- 返り値の型が変わるため既存関数を一度削除してから再作成する
drop function if exists public.search_shops(text, int, int, int, int, int);

create function public.search_shops(
  p_query          text,
  p_area_id        int  default null,
  p_category_id    int  default null,
  p_price_range_id int  default null,
  p_limit          int  default 20,
  p_offset         int  default 0
)
returns table (
  id              uuid,
  name            text,
  description     text,
  review_count    int,
  average_rating  float4,
  favorite_count  int,
  created_at      timestamptz,
  updated_at      timestamptz,
  areas           jsonb,
  price_ranges    jsonb,
  shop_categories jsonb,
  shop_tags       jsonb,
  shop_photos     jsonb,
  shop_brands     jsonb,
  rank            float4
)
language sql stable
as $$
  with matched as (
    select distinct s.id,
      greatest(
        similarity(s.name, p_query),
        coalesce((
          select max(similarity(b.name, p_query))
          from public.brands b
          join public.shop_brands sb on sb.brand_id = b.id
          where sb.shop_id = s.id
        ), 0),
        coalesce((
          select max(similarity(t.name, p_query))
          from public.tags t
          join public.shop_tags st on st.tag_id = t.id
          where st.shop_id = s.id
        ), 0)
      )::float4 as rank
    from public.shops s
    where s.status = 'public'
      and (
        s.name ilike '%' || p_query || '%'
        or exists(
          select 1 from public.brands b
          join public.shop_brands sb on sb.brand_id = b.id
          where sb.shop_id = s.id and b.name ilike '%' || p_query || '%'
        )
        or exists(
          select 1 from public.tags t
          join public.shop_tags st on st.tag_id = t.id
          where st.shop_id = s.id and t.name ilike '%' || p_query || '%'
        )
        or exists(
          select 1 from public.areas a
          where a.id = s.area_id
            and (a.prefecture ilike '%' || p_query || '%' or a.city ilike '%' || p_query || '%')
        )
      )
      and (p_area_id        is null or s.area_id        = p_area_id)
      and (p_price_range_id is null or s.price_range_id = p_price_range_id)
      and (p_category_id    is null or exists(
        select 1 from public.shop_categories sc
        where sc.shop_id = s.id and sc.category_id = p_category_id
      ))
  )
  select
    s.id,
    s.name,
    s.description,
    s.review_count,
    s.average_rating::float4,
    s.favorite_count,
    s.created_at,
    s.updated_at,
    case when a.id is not null then
      jsonb_build_object('id', a.id, 'prefecture', a.prefecture, 'city', a.city, 'slug', a.slug)
    end as areas,
    case when pr.id is not null then
      jsonb_build_object('id', pr.id, 'label', pr.label, 'min_price', pr.min_price, 'max_price', pr.max_price)
    end as price_ranges,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'categories', jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name)
      ))
      from public.shop_categories sc
      join public.categories c on c.id = sc.category_id
      where sc.shop_id = s.id
    ), '[]'::jsonb) as shop_categories,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'tags', jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
      ))
      from public.shop_tags st
      join public.tags t on t.id = st.tag_id
      where st.shop_id = s.id
    ), '[]'::jsonb) as shop_tags,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'shop_id', p.shop_id,
        'storage_path', p.storage_path, 'order', p."order", 'created_at', p.created_at
      ) order by p."order")
      from public.shop_photos p
      where p.shop_id = s.id
    ), '[]'::jsonb) as shop_photos,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'brands', jsonb_build_object(
          'id', b.id, 'name', b.name, 'name_kana', b.name_kana,
          'aliases', b.aliases, 'status', b.status,
          'merged_into', b.merged_into, 'submitted_by', b.submitted_by,
          'created_at', b.created_at
        )
      ))
      from public.shop_brands sb
      join public.brands b on b.id = sb.brand_id
      where sb.shop_id = s.id
    ), '[]'::jsonb) as shop_brands,
    m.rank
  from matched m
  join public.shops s on s.id = m.id
  left join public.areas a on a.id = s.area_id
  left join public.price_ranges pr on pr.id = s.price_range_id
  order by m.rank desc
  limit p_limit offset p_offset;
$$;

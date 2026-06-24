-- =============================================================
-- get_shop_wish_analytics 拡張（v2）
--
-- オーナーのウィッシュ分析をより「使える」ものにするため、以下を追加する。
--   1. 充足率: 同エリアの公開ウィッシュのうち、自店の公開アイテムで
--              条件を満たせる（マッチする）件数。fulfilled_wishes として返す。
--              マッチ条件は notify_wishes_for_shop_item と同一定義を踏襲。
--   2. カテゴリ→アイテムタイプの掘り下げ: by_item_category の各カテゴリに
--              item_types（タイプ別件数 TOP5）をネストする。
--   3. トレンド: 直近30日／前30日の新規ウィッシュ数と、直近30日の日次推移。
--
-- 既存フィールド（total_matching_wishes / by_item_category / top_demanded_brands）
-- は後方互換のため維持する（by_item_category は item_types を追加）。
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

    -- 充足: 自店の公開アイテムでマッチするウィッシュ数
    -- （マッチ条件は wish_item_match_triggers と同一）
    'fulfilled_wishes', (
      select count(*)
      from public.wishes w
      where w.is_public = true and w.status = 'active'
        and w.prefecture_id = v_prefecture_id
        and exists (
          select 1
          from public.shop_items si
          left join public.item_types it on it.id = si.item_type_id
          where si.shop_id = p_shop_id
            and si.is_available = true
            -- 種別
            and (
              (w.item_type_id is not null and w.item_type_id = si.item_type_id)
              or (w.item_type_id is null and w.item_category_id is not null
                  and w.item_category_id = it.item_category_id)
              or (w.item_type_id is null and w.item_category_id is null)
            )
            -- ブランド
            and (w.brand_id is null or w.brand_id = si.brand_id)
            -- サイズ
            and (w.size_id is null or w.size_id = any(si.size_ids))
            -- 価格
            and (
              si.price is null
              or exists (
                select 1 from public.price_ranges pr
                where pr.id = w.price_range_id
                  and coalesce(pr.min_price, 0)          <= si.price
                  and coalesce(pr.max_price, 2147483647) >= si.price
              )
            )
        )
    ),

    -- カテゴリ別ウィッシュ数（アイテムタイプ掘り下げ付き）
    'by_item_category', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', cat.id,
          'name', cat.name,
          'count', cat.cnt,
          'item_types', cat.item_types
        ) order by cat.cnt desc
      ), '[]'::jsonb)
      from (
        select
          ic.id,
          ic.name,
          count(*) as cnt,
          (
            select coalesce(jsonb_agg(t.row order by t.tcnt desc), '[]'::jsonb)
            from (
              select
                jsonb_build_object('id', it2.id, 'name', it2.name, 'count', count(*)) as row,
                count(*) as tcnt
              from public.wishes w2
              join public.item_types it2 on it2.id = w2.item_type_id
              where w2.is_public = true and w2.status = 'active'
                and w2.prefecture_id = v_prefecture_id
                and it2.item_category_id = ic.id
              group by it2.id, it2.name
              order by tcnt desc
              limit 5
            ) t
          ) as item_types
        from public.wishes w
        join public.item_categories ic on ic.id = w.item_category_id
        where w.is_public = true and w.status = 'active'
          and w.prefecture_id = v_prefecture_id
        group by ic.id, ic.name
        order by cnt desc
        limit 10
      ) cat
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
    ),

    -- トレンド: 新規ウィッシュ数の推移
    'trend', jsonb_build_object(
      'recent_count', (
        select count(*)
        from public.wishes w
        where w.is_public = true and w.status = 'active'
          and w.prefecture_id = v_prefecture_id
          and w.created_at >= now() - interval '30 days'
      ),
      'previous_count', (
        select count(*)
        from public.wishes w
        where w.is_public = true and w.status = 'active'
          and w.prefecture_id = v_prefecture_id
          and w.created_at >= now() - interval '60 days'
          and w.created_at <  now() - interval '30 days'
      ),
      'daily', (
        select coalesce(jsonb_agg(
          jsonb_build_object('date', to_char(d.day::date, 'YYYY-MM-DD'), 'count', coalesce(c.cnt, 0))
          order by d.day
        ), '[]'::jsonb)
        from generate_series(
          (now() - interval '29 days')::date,
          now()::date,
          interval '1 day'
        ) as d(day)
        left join (
          select w.created_at::date as day, count(*) as cnt
          from public.wishes w
          where w.is_public = true and w.status = 'active'
            and w.prefecture_id = v_prefecture_id
            and w.created_at >= (now() - interval '29 days')::date
          group by w.created_at::date
        ) c on c.day = d.day::date
      )
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_shop_wish_analytics(uuid) from public;
grant execute on function public.get_shop_wish_analytics(uuid) to authenticated;

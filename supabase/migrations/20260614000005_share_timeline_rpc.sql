-- =============================================================
-- シャレ活: タイムライン RPC（おすすめ/新着）
-- =============================================================
-- 公開（visibility=public・state/status=published）の投稿のみ返す。
--   recent : published_at の降順・キーセットページネーション
--   hot    : hot_score 降順・OFFSET ページネーション（直近30日対象）
-- hot_score = engagement(rating/comment/bookmark/impression) × quality(ベイズ平均) ÷ 時間減衰

create or replace function public.get_share_timeline(
  p_tab       text        default 'recent',
  p_limit     int         default 20,
  p_cursor_ts timestamptz default null,   -- recent 用カーソル（published_at）
  p_cursor_id uuid        default null,    -- recent 用カーソル（同 published_at のタイブレーク）
  p_offset    int         default 0        -- hot 用オフセット
)
returns setof public.share_posts
language sql stable security definer set search_path = ''
as $$
  -- 新着
  ( select p.*
    from public.share_posts p
    where p_tab = 'recent'
      and p.visibility = 'public' and p.state = 'published' and p.status = 'published'
      and (
        p_cursor_ts is null
        or p.published_at < p_cursor_ts
        or (p.published_at = p_cursor_ts and p.id < p_cursor_id)
      )
    order by p.published_at desc, p.id desc
    limit case when p_tab = 'recent' then greatest(p_limit, 1) else 0 end )

  union all

  -- おすすめ（hot）
  ( select p.*
    from public.share_posts p
    where p_tab = 'hot'
      and p.visibility = 'public' and p.state = 'published' and p.status = 'published'
      and p.published_at > now() - interval '30 days'
    order by
      (
        ( 1
          + p.rating_count
          + 1.5 * p.comment_count
          + 1.5 * p.bookmark_count
          + 2.0 * log(10, (p.impression_count + 1)::numeric)
        )
        * (0.5 + ((5 * 6.0 + p.rating_sum) / (5 + p.rating_count)) / 10.0)
      ) / power(extract(epoch from (now() - p.published_at)) / 3600 + 2, 1.5) desc,
      p.id desc
    limit  case when p_tab = 'hot' then greatest(p_limit, 1) else 0 end
    offset case when p_tab = 'hot' then greatest(p_offset, 0) else 0 end );
$$;

grant execute on function public.get_share_timeline(text, int, timestamptz, uuid, int) to anon, authenticated;

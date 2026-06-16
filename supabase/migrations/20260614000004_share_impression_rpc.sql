-- =============================================================
-- シャレ活: インプレッション記録 RPC
-- =============================================================
-- ログインユーザーの日次ユニーク。新規記録時のみ impression_count を +1。
-- 匿名（auth.uid() is null）は noop。公開済み投稿のみ計上。

create or replace function public.record_share_impression(p_post uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;  -- 匿名は計上しない
  end if;

  -- 公開済みの投稿のみ対象
  if not exists (
    select 1 from public.share_posts p
    where p.id = p_post and p.state = 'published' and p.status = 'published'
  ) then
    return;
  end if;

  insert into public.share_impressions (post_id, user_id, day)
  values (p_post, v_uid, current_date)
  on conflict (post_id, user_id, day) do nothing;

  if found then
    update public.share_posts
      set impression_count = impression_count + 1
      where id = p_post;
  end if;
end;
$$;

grant execute on function public.record_share_impression(uuid) to anon, authenticated;

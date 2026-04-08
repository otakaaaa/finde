-- =============================================================
-- ウィッシュマッチ通知トリガー
-- 店舗が公開状態になった際、ウィッシュのマッチングを行い通知を送る
--
-- マッチング条件（暫定）:
--   - カテゴリが一致（shop_categories）
--   - エリアが一致（wishes.area_id = shops.area_id）
--   - 価格帯が一致（wishes.price_range_id = shops.price_range_id）
--
-- TODO: マッチング精度の向上（ブランド条件の追加、エリア柔軟化など）
-- TODO: 大量マッチ時のパフォーマンス最適化（バッチ処理への移行）
-- =============================================================

create or replace function public.notify_on_shop_becomes_public()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop_id uuid;
begin
  -- INSERT で public、または UPDATE で non-public → public の場合のみ処理
  if not (
    (TG_OP = 'INSERT' and new.status = 'public')
    or (TG_OP = 'UPDATE' and (old.status is distinct from 'public') and new.status = 'public')
  ) then
    return new;
  end if;

  v_shop_id := new.id;

  -- マッチするウィッシュを持つユーザーへ通知を送る
  -- CTE で対象ユーザーを絞り込み（LIMIT で安全弁）、重複通知を防止
  with matching_users as (
    select distinct w.user_id
    from public.wishes w
    join public.shop_categories sc
      on sc.shop_id = v_shop_id
     and sc.category_id = w.category_id
    where w.area_id = new.area_id
      and w.price_range_id = new.price_range_id
      -- 店舗の登録者自身には送らない
      and w.user_id is distinct from new.created_by
    limit 100  -- 安全上限（将来的にバッチ処理へ移行する場合は撤廃）
  )
  insert into public.notifications (user_id, type, title, body, link_url, metadata)
  select
    mu.user_id,
    'wish_match',
    'ウィッシュにマッチする店舗が見つかりました',
    new.name || ' がウィッシュリストにマッチしています',
    '/shops/' || v_shop_id::text,
    jsonb_build_object('shop_id', v_shop_id)
  from matching_users mu
  -- 同一ユーザー × 同一店舗で24時間以内の重複通知を防止
  where not exists (
    select 1
    from public.notifications n
    where n.user_id = mu.user_id
      and n.type = 'wish_match'
      and n.metadata->>'shop_id' = v_shop_id::text
      and n.created_at > now() - interval '24 hours'
  );

  return new;
end;
$$;

create trigger on_shop_becomes_public_notify_wish_match
  after insert or update of status on public.shops
  for each row execute function public.notify_on_shop_becomes_public();

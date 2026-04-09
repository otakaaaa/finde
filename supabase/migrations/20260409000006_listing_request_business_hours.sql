-- =============================================================
-- shop_listing_requests に business_hours カラムを追加
-- =============================================================

alter table public.shop_listing_requests
  add column if not exists business_hours jsonb;

-- =============================================================
-- approve_listing_request を business_hours 対応に更新
-- =============================================================

create or replace function public.approve_listing_request(p_request_id uuid)
returns uuid  -- 作成された shop_id を返す
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req     record;
  v_shop_id uuid;
begin
  -- 管理者チェック
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  -- 申請データを取得（pending のもののみ）
  select * into v_req
  from public.shop_listing_requests
  where id = p_request_id and status = 'pending';

  if not found then
    raise exception 'Request not found or not in pending status';
  end if;

  -- ── 店舗を作成 ────────────────────────────────────────────
  insert into public.shops (
    name,
    description,
    prefecture_id,
    city_id,
    address,
    price_range_id,
    phone,
    website_url,
    instagram_url,
    twitter_url,
    tiktok_url,
    business_hours,
    status,
    created_by
  ) values (
    v_req.shop_name,
    v_req.description,
    v_req.prefecture_id,
    v_req.city_id,
    v_req.address,
    v_req.price_range_id,
    v_req.phone,
    v_req.website_url,
    v_req.instagram_url,
    v_req.twitter_url,
    v_req.tiktok_url,
    v_req.business_hours,
    'public',
    v_req.submitted_by
  )
  returning id into v_shop_id;

  -- ── カテゴリを登録 ────────────────────────────────────────
  if v_req.category_ids is not null and array_length(v_req.category_ids, 1) > 0 then
    insert into public.shop_categories (shop_id, category_id)
    select v_shop_id, unnest(v_req.category_ids);
  end if;

  -- ── 申請写真を shop_photos にコピー ───────────────────────
  insert into public.shop_photos (shop_id, storage_path, "order", created_at)
  select v_shop_id, storage_path, "order", created_at
  from public.listing_request_photos
  where request_id = p_request_id
  order by "order";

  -- ── オーナー申請の場合: ユーザーを昇格 ──────────────────
  if v_req.is_owner_request then
    update public.users
    set role = 'shop_owner', updated_at = now()
    where id = v_req.submitted_by;

    insert into public.shop_staffs (user_id, shop_id, staff_role)
    values (v_req.submitted_by, v_shop_id, 'owner')
    on conflict (user_id, shop_id) do nothing;
  end if;

  -- ── 申請ステータスを承認に更新 ───────────────────────────
  update public.shop_listing_requests
  set
    status      = 'approved',
    reviewed_by = auth.uid(),
    updated_at  = now()
  where id = p_request_id;

  return v_shop_id;
end;
$$;

revoke all on function public.approve_listing_request(uuid) from public;
grant execute on function public.approve_listing_request(uuid) to authenticated;

-- =============================================================
-- shop_categories / shop_tags にオーナー書き込みポリシーを追加
-- （shop_photos / shop_brands と同じ pattern に統一）
-- =============================================================

-- ── shop_categories ──────────────────────────────────────────

drop policy if exists "shop_categories: admin write" on public.shop_categories;

create policy "shop_categories: owner write" on public.shop_categories
  for all using (
    (select public.is_admin())
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

-- ── shop_tags ────────────────────────────────────────────────

drop policy if exists "shop_tags: admin write" on public.shop_tags;

create policy "shop_tags: owner write" on public.shop_tags
  for all using (
    (select public.is_admin())
    or exists(select 1 from public.shop_staffs ss where ss.shop_id = shop_id and ss.user_id = auth.uid())
  );

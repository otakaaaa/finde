-- =============================================================
-- 店舗オーナーによる status 改変を禁止（モデレーション回避の修正）
--
-- shops.status は管理者のモデレーション制御:
--   public  = 公開 / private = 管理者が非公開化 / pending = 審査待ち
--
-- 既存の "shops: owner update" ポリシーには WITH CHECK が無いため、
-- USING（= スタッフ所属）を満たす限りオーナーは全カラムを任意値に更新でき、
-- 直接 REST 呼び出しで
--   PATCH /rest/v1/shops?id=eq.<自店舗> { "status": "public" }
-- を送れば、管理者が private / pending にした店舗を一方的に再公開できた。
--
-- オーナー向けアプリ（useUpdateShop）は status を送らないため、
-- status の変更を禁止しても正規の編集フローは壊れない。
-- role 昇格対策と同じく SECURITY DEFINER ヘルパーで現在値を読み、
-- 新しい status が現在値と一致することを WITH CHECK で強制する。
-- =============================================================

-- 現在保存されている店舗の status を RLS 再帰なしで取得するヘルパー
create or replace function public.shop_status(p_shop_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select status from public.shops where id = p_shop_id
$$;

-- RLS の WITH CHECK は更新を行う authenticated ロールで評価されるため
-- authenticated のみ EXECUTE を付与する（anon への RPC 公開はしない）
revoke all on function public.shop_status(uuid) from public;
grant execute on function public.shop_status(uuid) to authenticated;

drop policy if exists "shops: owner update" on public.shops;
create policy "shops: owner update" on public.shops
  for update
  using (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = id and ss.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = id and ss.user_id = auth.uid()
    )
    -- オーナーは status を変更できない（管理者の "shops: admin update" は別ポリシー）
    and status = public.shop_status(id)
  );

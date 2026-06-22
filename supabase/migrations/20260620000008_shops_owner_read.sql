-- =============================================================
-- shops テーブルにオーナー用 SELECT ポリシーを追加
--
-- 既存の "shops: public read" は status = 'public' のみ許可するため、
-- pending / private の自店舗をオーナーが読めない。
-- その結果 useShop() が null を返し、編集フォームが初期化されず
-- 更新結果も確認できない。
-- =============================================================

create policy "shops: owner read" on public.shops
  for select using (
    exists (
      select 1 from public.shop_staffs ss
      where ss.shop_id = id and ss.user_id = auth.uid()
    )
  );

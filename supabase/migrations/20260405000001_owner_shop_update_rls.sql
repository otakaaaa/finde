-- Allow shop owners (shop_staffs) to update their own shops and manage categories

create policy "shops: owner update" on public.shops
  for update using (
    exists (
      select 1 from public.shop_staffs
      where shop_id = id
        and user_id = auth.uid()
    )
  );

-- =============================================================
-- shop_items → shop_item_types 自動同期トリガ
-- アイテムを登録すると item_type が shop_item_types に自動追加される
-- =============================================================

create or replace function public.sync_shop_item_type()
returns trigger language plpgsql as $$
begin
  if new.item_type_id is not null then
    insert into public.shop_item_types (shop_id, item_type_id)
    values (new.shop_id, new.item_type_id)
    on conflict (shop_id, item_type_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger shop_items_sync_item_type
  after insert or update of item_type_id on public.shop_items
  for each row execute function public.sync_shop_item_type();

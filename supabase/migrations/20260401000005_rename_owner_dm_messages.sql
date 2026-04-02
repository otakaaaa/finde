-- =============================================================
-- owner_dm_messages → listing_request_messages にリネーム
-- =============================================================

alter table public.owner_dm_messages
  rename to listing_request_messages;

-- Add city and address fields to shops
alter table public.shops
  add column city    text,
  add column address text;

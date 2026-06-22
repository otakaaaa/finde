-- =============================================================
-- sizes マスタ + item_categories.size_group
-- =============================================================

create table public.sizes (
  id          serial      primary key,
  code        text        not null unique,
  label       text        not null,
  size_group  text        not null check (size_group in ('general', 'bottoms', 'shoes')),
  "order"     smallint    not null default 0
);

alter table public.sizes enable row level security;

create policy "sizes: public read"
  on public.sizes for select using (true);

create policy "sizes: admin write"
  on public.sizes
  using (public.is_admin())
  with check (public.is_admin());

-- general（トップス / アウター / その他）
insert into public.sizes (code, label, size_group, "order") values
  ('free', 'FREE', 'general', 0),
  ('xs',   'XS',   'general', 1),
  ('s',    'S',    'general', 2),
  ('m',    'M',    'general', 3),
  ('l',    'L',    'general', 4),
  ('xl',   'XL',   'general', 5),
  ('2xl',  '2XL',  'general', 6),
  ('3xl',  '3XL',  'general', 7);

-- bottoms（ウエストインチ）
insert into public.sizes (code, label, size_group, "order") values
  ('w24', '24', 'bottoms',  0),
  ('w25', '25', 'bottoms',  1),
  ('w26', '26', 'bottoms',  2),
  ('w27', '27', 'bottoms',  3),
  ('w28', '28', 'bottoms',  4),
  ('w29', '29', 'bottoms',  5),
  ('w30', '30', 'bottoms',  6),
  ('w31', '31', 'bottoms',  7),
  ('w32', '32', 'bottoms',  8),
  ('w33', '33', 'bottoms',  9),
  ('w34', '34', 'bottoms', 10),
  ('w36', '36', 'bottoms', 11),
  ('w38', '38', 'bottoms', 12);

-- shoes（cm、0.5cm 刻み）
insert into public.sizes (code, label, size_group, "order") values
  ('s220', '22.0', 'shoes',  0),
  ('s225', '22.5', 'shoes',  1),
  ('s230', '23.0', 'shoes',  2),
  ('s235', '23.5', 'shoes',  3),
  ('s240', '24.0', 'shoes',  4),
  ('s245', '24.5', 'shoes',  5),
  ('s250', '25.0', 'shoes',  6),
  ('s255', '25.5', 'shoes',  7),
  ('s260', '26.0', 'shoes',  8),
  ('s265', '26.5', 'shoes',  9),
  ('s270', '27.0', 'shoes', 10),
  ('s275', '27.5', 'shoes', 11),
  ('s280', '28.0', 'shoes', 12);

-- item_categories に size_group を追加
alter table public.item_categories
  add column size_group text check (size_group in ('general', 'bottoms', 'shoes', 'none'));

update public.item_categories set size_group = case code
  when 'tops'      then 'general'
  when 'bottoms'   then 'bottoms'
  when 'outer'     then 'general'
  when 'shoes'     then 'shoes'
  when 'bag'       then 'none'
  when 'accessory' then 'none'
  when 'other'     then 'general'
  else 'general'
end;

alter table public.item_categories
  alter column size_group set not null,
  alter column size_group set default 'general';

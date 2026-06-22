-- =============================================================
-- material_types: 素材マスタ
-- =============================================================

create table public.material_types (
  id        serial primary key,
  code      text     unique not null,
  name      text     not null,
  "order"   smallint not null default 0,
  is_active bool     not null default true
);

alter table public.material_types enable row level security;

create policy "material_types: public read"
  on public.material_types for select using (true);
create policy "material_types: admin write"
  on public.material_types for all using ((select public.is_admin()));

-- =============================================================
-- シードデータ
-- =============================================================

insert into public.material_types (code, name, "order") values
  ('cotton',     'コットン',     1),
  ('wool',       'ウール',       2),
  ('nylon',      'ナイロン',     3),
  ('polyester',  'ポリエステル', 4),
  ('leather',    'レザー',       5),
  ('denim',      'デニム',       6),
  ('silk',       'シルク',       7),
  ('linen',      'リネン',       8),
  ('cashmere',   'カシミヤ',     9),
  ('suede',      'スエード',    10),
  ('velvet',     'ベルベット',  11),
  ('acrylic',    'アクリル',    12),
  ('rayon',      'レーヨン',    13),
  ('tencel',     'テンセル',    14),
  ('corduroy',   'コーデュロイ', 15),
  ('canvas',     'キャンバス',  16),
  ('fleece',     'フリース',    17);

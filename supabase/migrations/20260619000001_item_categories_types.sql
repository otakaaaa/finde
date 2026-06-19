-- =============================================================
-- アイテムカテゴリ・アイテムタイプ
-- =============================================================

create table public.item_categories (
  id      serial primary key,
  code    text     unique not null,
  name    text     not null,
  "order" smallint not null default 0
);

create table public.item_types (
  id               serial primary key,
  item_category_id int      not null references public.item_categories(id) on delete cascade,
  code             text     unique not null,
  name             text     not null,
  "order"          smallint not null default 0
);

create index item_types_category_idx on public.item_types (item_category_id, "order");

-- RLS: 全ユーザー読み取り可、書き込みは管理者のみ
alter table public.item_categories enable row level security;
alter table public.item_types      enable row level security;

create policy "item_categories: public read"
  on public.item_categories for select using (true);
create policy "item_categories: admin write"
  on public.item_categories for all using ((select public.is_admin()));

create policy "item_types: public read"
  on public.item_types for select using (true);
create policy "item_types: admin write"
  on public.item_types for all using ((select public.is_admin()));

-- =============================================================
-- シードデータ
-- =============================================================

insert into public.item_categories (code, name, "order") values
  ('tops',      'トップス',      1),
  ('bottoms',   'ボトムス',      2),
  ('outer',     'アウター',      3),
  ('shoes',     'シューズ',      4),
  ('bag',       'バッグ',        5),
  ('accessory', 'アクセサリー',  6),
  ('other',     'その他',        7);

insert into public.item_types (item_category_id, code, name, "order") values
  -- トップス
  ((select id from public.item_categories where code = 'tops'), 'knit',       'ニット',          1),
  ((select id from public.item_categories where code = 'tops'), 'tshirt',     'Tシャツ',         2),
  ((select id from public.item_categories where code = 'tops'), 'shirt',      'シャツ',          3),
  ((select id from public.item_categories where code = 'tops'), 'hoodie',     'パーカー',        4),
  ((select id from public.item_categories where code = 'tops'), 'sweat',      'スウェット',      5),
  ((select id from public.item_categories where code = 'tops'), 'tank',       'タンクトップ',    6),
  ((select id from public.item_categories where code = 'tops'), 'polo',       'ポロシャツ',      7),
  ((select id from public.item_categories where code = 'tops'), 'blouse',     'ブラウス',        8),
  -- ボトムス
  ((select id from public.item_categories where code = 'bottoms'), 'denim',      'デニム',        1),
  ((select id from public.item_categories where code = 'bottoms'), 'chino',      'チノパン',      2),
  ((select id from public.item_categories where code = 'bottoms'), 'slacks',     'スラックス',    3),
  ((select id from public.item_categories where code = 'bottoms'), 'skirt',      'スカート',      4),
  ((select id from public.item_categories where code = 'bottoms'), 'shorts',     'ショーツ',      5),
  ((select id from public.item_categories where code = 'bottoms'), 'cargo',      'カーゴパンツ',  6),
  ((select id from public.item_categories where code = 'bottoms'), 'sweatpants', 'スウェットパンツ', 7),
  -- アウター
  ((select id from public.item_categories where code = 'outer'), 'ma1',         'MA-1',            1),
  ((select id from public.item_categories where code = 'outer'), 'denim_jacket','デニムジャケット', 2),
  ((select id from public.item_categories where code = 'outer'), 'trench',      'トレンチコート', 3),
  ((select id from public.item_categories where code = 'outer'), 'down',        'ダウンジャケット', 4),
  ((select id from public.item_categories where code = 'outer'), 'coat',        'コート',          5),
  ((select id from public.item_categories where code = 'outer'), 'blouson',     'ブルゾン',        6),
  ((select id from public.item_categories where code = 'outer'), 'leather_jacket', 'レザージャケット', 7),
  ((select id from public.item_categories where code = 'outer'), 'hoodie_zip',  'ジップパーカー',  8),
  -- シューズ
  ((select id from public.item_categories where code = 'shoes'), 'sneakers',   'スニーカー',      1),
  ((select id from public.item_categories where code = 'shoes'), 'loafers',    'ローファー',      2),
  ((select id from public.item_categories where code = 'shoes'), 'boots',      'ブーツ',          3),
  ((select id from public.item_categories where code = 'shoes'), 'sandals',    'サンダル',        4),
  ((select id from public.item_categories where code = 'shoes'), 'oxfords',    'オックスフォード', 5),
  ((select id from public.item_categories where code = 'shoes'), 'mules',      'ミュール',        6),
  -- バッグ
  ((select id from public.item_categories where code = 'bag'), 'tote',         'トートバッグ',    1),
  ((select id from public.item_categories where code = 'bag'), 'backpack',     'バックパック',    2),
  ((select id from public.item_categories where code = 'bag'), 'shoulder',     'ショルダーバッグ', 3),
  ((select id from public.item_categories where code = 'bag'), 'clutch',       'クラッチバッグ',  4),
  ((select id from public.item_categories where code = 'bag'), 'boston',       'ボストンバッグ',  5),
  ((select id from public.item_categories where code = 'bag'), 'wallet',       'ウォレット',      6),
  -- アクセサリー
  ((select id from public.item_categories where code = 'accessory'), 'ring',      'リング',        1),
  ((select id from public.item_categories where code = 'accessory'), 'necklace',  'ネックレス',    2),
  ((select id from public.item_categories where code = 'accessory'), 'bracelet',  'ブレスレット',  3),
  ((select id from public.item_categories where code = 'accessory'), 'earring',   'ピアス・イヤリング', 4),
  ((select id from public.item_categories where code = 'accessory'), 'watch',     '時計',          5),
  ((select id from public.item_categories where code = 'accessory'), 'hat',       '帽子',          6),
  ((select id from public.item_categories where code = 'accessory'), 'belt',      'ベルト',        7),
  ((select id from public.item_categories where code = 'accessory'), 'scarf',     'スカーフ・マフラー', 8);

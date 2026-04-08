-- ── prefectures table ────────────────────────────────────────────
create table public.prefectures (
  id       smallint primary key,
  name     text     not null,
  name_en  text     not null,
  region   text     not null,
  slug     text     not null unique
);

insert into public.prefectures (id, name, name_en, region, slug) values
  (1,  '北海道',   'Hokkaido',   '北海道',     'hokkaido'),
  (2,  '青森県',   'Aomori',     '東北',       'aomori'),
  (3,  '岩手県',   'Iwate',      '東北',       'iwate'),
  (4,  '宮城県',   'Miyagi',     '東北',       'miyagi'),
  (5,  '秋田県',   'Akita',      '東北',       'akita'),
  (6,  '山形県',   'Yamagata',   '東北',       'yamagata'),
  (7,  '福島県',   'Fukushima',  '東北',       'fukushima'),
  (8,  '茨城県',   'Ibaraki',    '関東',       'ibaraki'),
  (9,  '栃木県',   'Tochigi',    '関東',       'tochigi'),
  (10, '群馬県',   'Gunma',      '関東',       'gunma'),
  (11, '埼玉県',   'Saitama',    '関東',       'saitama'),
  (12, '千葉県',   'Chiba',      '関東',       'chiba'),
  (13, '東京都',   'Tokyo',      '関東',       'tokyo'),
  (14, '神奈川県', 'Kanagawa',   '関東',       'kanagawa'),
  (15, '新潟県',   'Niigata',    '中部',       'niigata'),
  (16, '富山県',   'Toyama',     '中部',       'toyama'),
  (17, '石川県',   'Ishikawa',   '中部',       'ishikawa'),
  (18, '福井県',   'Fukui',      '中部',       'fukui'),
  (19, '山梨県',   'Yamanashi',  '中部',       'yamanashi'),
  (20, '長野県',   'Nagano',     '中部',       'nagano'),
  (21, '岐阜県',   'Gifu',       '中部',       'gifu'),
  (22, '静岡県',   'Shizuoka',   '中部',       'shizuoka'),
  (23, '愛知県',   'Aichi',      '中部',       'aichi'),
  (24, '三重県',   'Mie',        '近畿',       'mie'),
  (25, '滋賀県',   'Shiga',      '近畿',       'shiga'),
  (26, '京都府',   'Kyoto',      '近畿',       'kyoto'),
  (27, '大阪府',   'Osaka',      '近畿',       'osaka'),
  (28, '兵庫県',   'Hyogo',      '近畿',       'hyogo'),
  (29, '奈良県',   'Nara',       '近畿',       'nara'),
  (30, '和歌山県', 'Wakayama',   '近畿',       'wakayama'),
  (31, '鳥取県',   'Tottori',    '中国',       'tottori'),
  (32, '島根県',   'Shimane',    '中国',       'shimane'),
  (33, '岡山県',   'Okayama',    '中国',       'okayama'),
  (34, '広島県',   'Hiroshima',  '中国',       'hiroshima'),
  (35, '山口県',   'Yamaguchi',  '中国',       'yamaguchi'),
  (36, '徳島県',   'Tokushima',  '四国',       'tokushima'),
  (37, '香川県',   'Kagawa',     '四国',       'kagawa'),
  (38, '愛媛県',   'Ehime',      '四国',       'ehime'),
  (39, '高知県',   'Kochi',      '四国',       'kochi'),
  (40, '福岡県',   'Fukuoka',    '九州・沖縄', 'fukuoka'),
  (41, '佐賀県',   'Saga',       '九州・沖縄', 'saga'),
  (42, '長崎県',   'Nagasaki',   '九州・沖縄', 'nagasaki'),
  (43, '熊本県',   'Kumamoto',   '九州・沖縄', 'kumamoto'),
  (44, '大分県',   'Oita',       '九州・沖縄', 'oita'),
  (45, '宮崎県',   'Miyazaki',   '九州・沖縄', 'miyazaki'),
  (46, '鹿児島県', 'Kagoshima',  '九州・沖縄', 'kagoshima'),
  (47, '沖縄県',   'Okinawa',    '九州・沖縄', 'okinawa');

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.prefectures enable row level security;

create policy "prefectures: public read"
  on public.prefectures for select
  to public
  using (true);

-- ── Add prefecture_id to shops ───────────────────────────────────
alter table public.shops
  add column prefecture_id smallint references public.prefectures(id);

-- Backfill from existing area data
update public.shops s
set prefecture_id = p.id
from public.areas a
join public.prefectures p on p.name = a.prefecture
where s.area_id = a.id
  and s.prefecture_id is null;

# 店舗フォロー機能 設計書

作成日: 2026-07-11 / 更新: 2026-07-11(v2: 全面リネーム方針・メール通知と通知設定を追加) / ステータス: ドラフト

## 1. 目的と背景

FINDEには既に「お気に入り」(shops への favorites)があるが、保存リストとしての受動的な機能に留まっており、再訪問の動機を生んでいない。本改修では、お気に入りを「フォロー」という能動的な関係に再定義し、フォロー中の店舗の更新(お知らせ)がアプリ内通知とメールでユーザーに届く仕組みを作る。ユーザー側には「フィードを開く理由」が、店舗側には「フォロワー数」という掲載価値の可視化が生まれ、将来の店舗向け有料プランの土台となる。

ユーザー同士のフォローは本設計のスコープ外とする(投稿者数が育ってから別途設計)。

## 2. 基本方針

「お気に入り」の概念を**表示文言だけでなく、DBテーブル名・カラム名・関数名・ファイル名・ルートパスまで含めて「フォロー」に全面リネーム**する。既存データは `alter table ... rename` で無停止に引き継ぐ。

## 3. リネーム対応表

### 3.1 DB(新規マイグレーション `rename_favorites_to_shop_follows.sql`)

| 現状 | 変更後 |
|---|---|
| `public.favorites` テーブル | `public.shop_follows` |
| `favorites_user_id_shop_id_key` 等の制約/索引 | `shop_follows_*` に改名 |
| `shops.favorite_count` カラム | `shops.follower_count` |
| `update_shop_favorite_count()` 関数 | `update_shop_follower_count()` |
| `on_favorite_change` トリガー | `on_shop_follow_change` |
| favorites の RLS ポリシー群 | 同内容で `shop_follows_*` として再作成 |

```sql
alter table public.favorites rename to shop_follows;
alter table public.shops rename column favorite_count to follower_count;
-- 関数・トリガー・ポリシーは drop → 新名称で create（内容は現行と同一）
```

適用後に `npm run supabase:types` で型を再生成する。

### 3.2 フロントエンド

| 現状 | 変更後 |
|---|---|
| `src/hooks/useFavorites.ts` | `src/hooks/useShopFollows.ts`(`useFollowStatus` / `useToggleFollow` / `useFollowedShops` / `useFollowsCount`) |
| `src/pages/mypage/FavoritesPage.tsx` | `src/pages/mypage/FollowedShopsPage.tsx` |
| ルート `/mypage/favorites` | `/mypage/follows`(旧URLは `routes.ts` でリダイレクトルートを用意) |
| 型 `Shop.favoriteCount` | `Shop.followerCount` |
| React Query キー `['favorite', ...]` `['favorites-count', ...]` | `['shop-follow', ...]` `['shop-follows-count', ...]` |
| 表示文言「お気に入り」 | 「フォロー」「フォロー中の店舗」 |
| 管理画面の集計ラベル(`AdminAnalyticsPage` の favorites) | follows に改名 |

robots.txt の `Disallow: /mypage/` はプレフィックス一致のため変更不要。

## 4. 通知設計(アプリ内 + メール)

### 4.1 全体像

店舗オーナーがお知らせ(`shop_announcements`)を公開すると、フォロワーに対して2チャネルで通知する。**送る側(店舗)と受け取る側(ユーザー)の双方が、チャネルごとにON/OFFを制御**でき、両方がONのときだけ届く。

```
配信条件 = 店舗側の送信設定(チャネル別) AND ユーザー側の受信設定(チャネル別)
```

### 4.2 店舗側: 送信設定

`shop_announcements` にチャネル別の送信フラグを追加する。お知らせ作成フォーム(`OwnerShopAnnouncementsPage`)にチェックボックス「アプリ内通知を送る」(既定ON)/「メール通知を送る」(既定OFF)を追加。

```sql
alter table public.shop_announcements
  add column notify_in_app boolean not null default true,
  add column notify_email  boolean not null default false;
```

### 4.3 ユーザー側: 受信設定

拡張性を考え、users へのカラム追加ではなく設定テーブルを新設する(将来の通知種別追加に備え1行=1ユーザーのワイド型)。

```sql
create table public.user_notification_settings (
  user_id                 uuid primary key references public.users(id) on delete cascade,
  followed_shop_in_app    boolean not null default true,
  followed_shop_email     boolean not null default true,
  updated_at              timestamptz not null default now()
);
-- RLS: 本人のみ select / insert / update
```

行が無いユーザーは既定値(両方ON)として扱う。UI はマイページ「通知」(`/mypage/notifications`)に「通知設定」セクションを追加し、「フォロー中の店舗のお知らせ」をアプリ内・メールそれぞれトグルで制御する。

### 4.4 配信フロー

お知らせ公開(insert かつ `is_active = true`)をトリガーに、既存のウィッシュ通知と同じパターン(トリガー → pg_net + Vault → Edge Function)で配信する。

アプリ内通知: トリガー関数内で直接 insert。

```sql
-- notifications.type に 'followed_shop_announcement' を追加
insert into public.notifications (user_id, type, title, body, link_url)
select f.user_id, 'followed_shop_announcement',
       s.name || 'からのお知らせ', new.title, '/shops/' || new.shop_id::text
from public.shop_follows f
join public.shops s on s.id = new.shop_id
left join public.user_notification_settings ns on ns.user_id = f.user_id
where f.shop_id = new.shop_id
  and new.notify_in_app
  and coalesce(ns.followed_shop_in_app, true);
```

メール通知: `new.notify_email = true` かつ受信ONのフォロワーが存在する場合のみ、Edge Function `send-follow-announcement-email` を pg_net で非同期呼び出し。Edge Function 側で対象ユーザーのメールアドレス(auth.users)を解決し、`email_templates` にテンプレート `followed_shop_announcement` を追加して送信する(既存 `send-wish-match-email` の実装を踏襲)。

### 4.5 メール要件(法令・スパム対策)

特定電子メール法対応として、メール本文フッターに配信停止リンク(ワンクリックで `followed_shop_email = false` に更新するトークン付きURL → 専用の軽量ページ)を必ず含める。頻度制御として同一店舗からのメールは1日1通までにキャップする(Edge Function 内で当日送信履歴を確認。履歴テーブル `follow_email_log(shop_id, sent_on date)` を追加)。update での再通知は行わない。

## 5. フェーズ分割

Phase 1: 全面リネーム(DB + フロント) + フォローボタンUI(未フォロー=黒「フォローする」/フォロー中=白「フォロー中 ✓」+ Undoトースト) + 店舗詳細に「フォロワー ○人」表示。

Phase 2: 通知基盤 — `user_notification_settings`、`shop_announcements` の送信フラグ、通知トリガー(アプリ内)、通知設定UI、`NotificationsPage`/`NotificationBell` の type 追加。

Phase 3: メール通知 — Edge Function `send-follow-announcement-email`、メールテンプレート、配信停止リンク、頻度キャップ。

Phase 4: フォローフィード — トップに「フォロー中」タブ。`get_follow_feed` RPC(お知らせ/新商品/関連シャレ活を時系列混在)。

Phase 5(任意): オーナーダッシュボードにフォロワー数・推移表示(有料プラン布石)。

Phase 1〜3 は順にリリース可能。各フェーズでE2E(フォロー→お知らせ公開→通知受信)を追加する。

## 6. 非機能・互換性

既存 favorites データは rename によりそのまま引き継がれる。RLS は現行同等(本人のみ書き込み・参照)。フォロワー数集計は既存トリガーの改名版で継続。旧URL `/mypage/favorites` はリダイレクトで互換維持。メール配信は非同期(pg_net)のためお知らせ公開のレスポンスをブロックしない。フォロワー数千人規模になったらメール送信のバッチ/キュー化を再検討する。

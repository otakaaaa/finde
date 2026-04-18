# タスクリスト - フクナビ

## 概要

- 総タスク数: 38
- 推定作業時間: 約120時間（15人日）
- 優先度: フェーズ順に実装

---

## Phase 1: 基盤構築

### Task 1.1: フロントエンドプロジェクト初期化

- [ ] `npm create vite@latest fukunavi -- --template react-ts` で雛形作成
- [ ] Tailwind CSS v4 インストール・設定
- [ ] shadcn/ui 初期化（`npx shadcn@latest init`）
- [ ] TanStack Query v5 / Zustand / React Router v7 / React Hook Form + Zod インストール
- [ ] `src/types/index.ts` に全型定義を記述
- [ ] `src/lib/supabase.ts` に Supabase クライアント初期化
- [ ] `public/_redirects` に `/* /index.html 200` 追記（SPA ルーティング対策）
- [ ] `.env.local` テンプレート（`.env.example`）作成
- **完了条件**: `npm run dev` でトップページが表示される
- **依存**: なし
- **推定時間**: 2h

### Task 1.2: Supabase ローカル環境構築

- [ ] `supabase init` でローカル環境初期化
- [ ] `supabase start` でローカル起動確認
- [ ] Supabase プロジェクト（staging / production）の2プロジェクト作成
- [ ] `pg_bigm` 拡張を staging・production 双方で有効化
- [ ] GitHub リポジトリ作成・Cloudflare Pages と接続
- **完了条件**: `supabase start` が成功し、ローカル Studio にアクセスできる
- **依存**: なし
- **推定時間**: 2h

### Task 1.3: マスタテーブル マイグレーション

- [ ] `areas`（都道府県・市区町村）テーブル作成
- [ ] `categories`（mens/ladies/kids/unisex/vintage）テーブル作成・初期データ投入
- [ ] `price_ranges` テーブル作成・初期データ投入（～5,000円 / 5,001〜10,000円 / …）
- [ ] `tags` テーブル作成
- [ ] `ng_words` テーブル作成
- [ ] 主要エリア（都道府県 + 主要市区町村）の初期データ投入
- **完了条件**: マスタテーブル全件に初期データが入った状態で `supabase db push` が通る
- **依存**: Task 1.2
- **推定時間**: 3h

### Task 1.4: コアテーブル マイグレーション

- [ ] `users` テーブル作成（auth.users のミラー + role）
- [ ] `users` 用 INSERT トリガー（auth.users 新規作成時に public.users へ自動挿入）
- [ ] `shops` テーブル作成（search_vector generated column, bigm インデックス含む）
- [ ] `shop_categories` / `shop_tags` / `shop_photos` / `shop_staffs` テーブル作成
- [ ] `brands` テーブル作成（search_vector, bigm インデックス含む）
- [ ] `shop_brands` テーブル作成
- [ ] `reviews` テーブル作成（shops との unique 制約含む）
- [ ] `review_photos` / `review_reports` テーブル作成
- [ ] `favorites` テーブル作成
- [ ] `wishes` テーブル作成
- [ ] `shop_listing_requests` / `owner_applications` テーブル作成
- [ ] `subscriptions` テーブル作成
- [ ] `shops` に集計カラム追加（`review_count`, `average_rating`, `favorite_count`）
- [ ] review INSERT/DELETE 時に shops 集計カラムを更新するトリガー作成
- [ ] favorite INSERT/DELETE 時に shops.favorite_count を更新するトリガー作成
- **完了条件**: 全テーブルが作成され、トリガーの動作確認ができる
- **依存**: Task 1.3
- **推定時間**: 4h

### Task 1.5: RLS ポリシー設定

- [ ] `shops` RLS（public読み取り・admin書き込み）
- [ ] `reviews` RLS（public読み取り・本人INSERT/UPDATE・admin status変更）
- [ ] `review_reports` RLS（admin読み取り・authenticated INSERT）
- [ ] `wishes` RLS（is_public=true 全員・自分のは全件・本人のみ書き込み）
- [ ] `favorites` RLS（本人のみ）
- [ ] `brands` RLS（active は全員読み取り・authenticated INSERT・admin UPDATE）
- [ ] `subscriptions` RLS（本人と admin 読み取り・service role のみ書き込み）
- [ ] `shop_listing_requests` RLS（本人と admin・authenticated INSERT）
- [ ] `ng_words` RLS（全読み取り禁止・admin のみ管理）
- [ ] `shop_staffs` RLS（関連 shop_owner 読み取り・admin 管理）
- [ ] Supabase Storage バケット作成（`shop-photos` / `review-photos`）と Policy 設定
- **完了条件**: RLS 有効状態でロール別アクセス制御が意図通り動作する
- **依存**: Task 1.4
- **推定時間**: 3h

### Task 1.6: フロントエンド共通基盤

- [ ] React Router v7 のルーティング設定（全ルート定義）
- [ ] `Layout` / `Header` / `Footer` コンポーネント作成
- [ ] `ProtectedRoute` コンポーネント作成（role チェック含む）
- [ ] `useAuth` フック作成（Supabase Auth セッション管理）
- [ ] Zustand `uiStore`（モーダル・トースト・フィルタ状態）作成
- [ ] shadcn/ui 基本コンポーネント追加（Button / Input / Badge / Modal / Toaster）
- [ ] TanStack Query の `QueryClientProvider` 設定
- [ ] エラーバウンダリ・ローディングスピナー作成
- **完了条件**: 各ルートへのナビゲーションが動作し、未ログイン時に保護ルートでリダイレクトされる
- **依存**: Task 1.1, Task 1.5
- **推定時間**: 3h

---

## Phase 2: 認証

### Task 2.1: メール + パスワード認証

- [ ] 新規登録ページ（`/auth/register`）実装
- [ ] ログインページ（`/auth/login`）実装
- [ ] パスワードリセットフロー（メール送信 → リセットページ）実装
- [ ] ログアウト処理実装
- [ ] Zod バリデーション（メール形式・パスワード強度）
- **完了条件**: メールでの登録・ログイン・パスワードリセットが一通り動作する
- **依存**: Task 1.6
- **推定時間**: 3h

### Task 2.2: Google OAuth 認証

- [ ] Supabase Auth の Google プロバイダー設定（Google Cloud Console での OAuth クライアント作成）
- [ ] Google ログインボタン実装
- [ ] OAuthコールバック処理（`/auth/callback` ルート）
- [ ] ログイン後ロール別リダイレクト実装
- **完了条件**: Google ログインから role 別リダイレクトまで動作する
- **依存**: Task 2.1
- **推定時間**: 2h

### Task 2.3: アカウント統合フロー

- [ ] Supabase Auth の "Automatically link identities" を OFF に設定
- [ ] Google OAuth 試行時に既存メールアドレス検出 → `/auth/link-account` リダイレクト処理
- [ ] `LinkAccountPage` 実装（「既存アカウントが見つかりました」UI）
- [ ] パスワード確認 or メールOTP による本人確認実装
- [ ] 確認成功後 `linkIdentity` API でアカウントリンク
- **完了条件**: 既存メールアカウントに Google identity がリンクされる
- **依存**: Task 2.2
- **推定時間**: 3h

---

## Phase 3: 一般ユーザー機能

### Task 3.1: 店舗一覧ページ

- [ ] `ShopsPage` 実装（`/shops`）
- [ ] `ShopCard` コンポーネント実装（店舗名・エリア・カテゴリ・評価・写真）
- [ ] `ShopFilters` コンポーネント実装（エリア / カテゴリ / 価格帯 / タグ / ブランド）
- [ ] ソート選択（人気順・新着順・高評価順）実装
- [ ] `useShops` フック実装（TanStack Query + cursor-based pagination）
- [ ] ページング（20件/ページ）実装
- **完了条件**: フィルタ・ソート・ページングが動作し、店舗カードが表示される
- **依存**: Task 1.6
- **推定時間**: 4h

<!-- ### Task 3.2: 全文検索 -->

- [ ] `search_shops` PostgreSQL RPC 関数作成（pg_bigm 横断検索: 店舗名・ブランド名・タグ・市区町村）
- [ ] `useShops` フックに検索クエリ対応を追加
- [ ] 検索結果の一致度スコアによるランキング表示
- **完了条件**: キーワード検索でブランド名・タグを横断した結果が表示される
- **依存**: Task 3.1
- **推定時間**: 4h

### Task 3.3: 店舗詳細ページ

- [ ] `ShopDetailPage` 実装（`/shops/:id`）
- [ ] 基本情報表示（営業時間・定休日・電話・URL・SNS・説明文）
- [ ] 取り扱いブランド一覧表示
- [ ] 写真ギャラリー表示（Supabase Storage transform で WebP リサイズ）
- [ ] `useShop` フック実装
- **完了条件**: 店舗詳細の全情報が正しく表示される
- **依存**: Task 3.1
- **推定時間**: 3h

### Task 3.4: お気に入り機能

- [ ] `useFavorites` フック実装（登録・解除・一覧取得）
- [ ] `ShopDetailPage` にお気に入りボタン追加（未ログイン時はログイン誘導）
- [ ] `FavoritesPage` 実装（`/mypage/favorites`）
- [ ] お気に入り数の楽観的更新（Optimistic Update）
- **完了条件**: お気に入り登録・解除・マイページでの一覧表示が動作する
- **依存**: Task 3.3, Task 2.1
- **推定時間**: 2h

### Task 3.5: レビュー投稿・編集

- [ ] `ReviewForm` コンポーネント実装（評価 1〜5・本文・画像添付）
- [ ] `ReviewCard` コンポーネント実装
- [ ] `useReviews` フック実装（投稿・編集・一覧取得）
- [ ] 1ユーザー1店舗1レビューの UI 制御（既存レビューがあれば編集モード）
- [ ] 画像アップロード（Supabase Storage `review-photos/`）
- [ ] レビュー一覧を `ShopDetailPage` に組み込み
- **完了条件**: レビューの投稿・編集・表示が動作し、画像アップロードができる
- **依存**: Task 3.3, Task 2.1
- **推定時間**: 4h

### Task 3.6: レビュー通報

- [ ] `ReviewReportModal` コンポーネント実装（理由選択式: 虚偽情報・誹謗中傷・関係のない内容・その他）
- [ ] `ReviewCard` に通報ボタン追加（本人のレビューには非表示）
- [ ] 通報送信処理（`review_reports` INSERT）
- [ ] 1ユーザー1レビュー1通報の UI 制御（通報済みは非活性）
- **完了条件**: 通報モーダルから送信でき、DB に記録される
- **依存**: Task 3.5
- **推定時間**: 2h

### Task 3.7: ブランド登録

- [ ] `BrandSearchInput` コンポーネント実装（入力中にリアルタイム類似検索・候補表示）
- [ ] 類似ブランド候補表示 UI（選択を促すインライン候補リスト）
- [ ] 新規ブランド投稿フォーム（正規名・読み仮名・別表記）
- [ ] `useBrands` フック実装（類似検索・投稿）
- [ ] 投稿後の `notify-admin` Edge Function 呼び出し
- **完了条件**: ブランド名入力時に類似候補が表示され、新規投稿が DB に保存される
- **依存**: Task 1.6, Task 2.1
- **推定時間**: 3h

### Task 3.8: ウィッシュ登録

- [ ] `WishForm` コンポーネント実装（タイプ・カテゴリ・価格帯・エリア（必須）+ 任意項目）
- [ ] `useWishes` フック実装（登録・一覧・削除）
- [ ] `WishesPage` 実装（`/wishes`）
- [ ] `WishNewPage` 実装（`/wishes/new`）
- [ ] 公開/非公開・メール通知 ON/OFF の設定 UI
- **完了条件**: ウィッシュの登録・一覧表示・削除が動作する
- **依存**: Task 2.1, Task 1.3
- **推定時間**: 3h

<!-- ### Task 3.9: ウィッシュ登録直後レコメンド -->

- [ ] `get_wish_recommendations` PostgreSQL RPC 関数作成（カテゴリ・価格帯・エリア完全一致）
- [ ] `WishRecommendList` コンポーネント実装（一致理由バッジ付き店舗カード）
- [ ] `WishNewPage` にレコメンド結果セクション追加（登録完了直後に表示）
- **完了条件**: ウィッシュ登録後にマッチした店舗と一致理由が表示される
- **依存**: Task 3.8, Task 3.3
- **推定時間**: 3h

### Task 3.10: マイページ

- [ ] `MyPage` 実装（`/mypage`）
- [ ] プロフィール表示・表示名変更
- [ ] 自分のレビュー一覧リンク
- [ ] ウィッシュ一覧リンク
- [ ] お気に入り一覧リンク
- **完了条件**: マイページから各機能へ遷移できる
- **依存**: Task 3.4, Task 3.5, Task 3.8
- **推定時間**: 2h

---

## Phase 4: 店舗管理者機能

### Task 4.1: 店舗掲載申請フォーム

- [ ] 掲載申請ページ実装（`/listing-request`）
- [ ] 申請フォーム（店舗名・住所・カテゴリ・URL・備考・オーナー申請フラグ）
- [ ] 申請時に既存店舗の類似検索を表示（重複抑制）
- [ ] `shop_listing_requests` INSERT 処理
- [ ] `notify-admin` Edge Function 呼び出し
- **完了条件**: 申請フォームから送信でき、運営への通知が届く
- **依存**: Task 2.1, Task 6.1
- **推定時間**: 3h

### Task 4.2: 店舗情報編集

- [ ] `ShopEditPage` 実装（`/owner/shops/:id`）
- [ ] 店舗基本情報編集（営業時間 / 定休日 / 電話 / URL / SNS / 説明文）
- [ ] 店舗名変更申請（`name_pending` に保存・admin 承認フロー）
- [ ] 店舗写真アップロード・並び替え・削除（Supabase Storage `shop-photos/`）
- [ ] エリア分類・価格帯分類の変更
- [ ] カテゴリ・タグの変更
- **完了条件**: shop_owner が自店舗の情報を編集でき、変更が反映される
- **依存**: Task 4.1（shop_owner ロール確認のため）, Task 5.3
- **推定時間**: 4h

### Task 4.3: ブランド管理（shop_owner）

- [ ] `BrandsManagePage` 実装（`/owner/shops/:id/brands`）
- [ ] 取り扱いブランドの追加（`BrandSearchInput` 再利用）
- [ ] 取り扱いブランドの削除
- **完了条件**: shop_owner が自店舗の取り扱いブランドを管理できる
- **依存**: Task 4.2, Task 3.7
- **推定時間**: 2h

### Task 4.4: オーナーダッシュボード

- [ ] `OwnerDashboardPage` 実装（`/owner/dashboard`）
- [ ] 自店舗に関連するウィッシュ集計表示（カテゴリ・価格帯・エリア別）
- [ ] 関連ウィッシュの `is_public=true` 件数表示
- [ ] 自店舗のレビュー閲覧（返信ボタンなし）
- **完了条件**: shop_owner がダッシュボードでウィッシュ需要とレビューを確認できる
- **依存**: Task 4.2
- **推定時間**: 3h

---

## Phase 5: 決済（Stripe）

### Task 5.1: Stripe Checkout セッション作成

- [ ] Stripe アカウント作成・商品（月額 ¥1,980 / 年額 ¥19,800）設定
- [ ] `create-checkout-session` Edge Function 作成（shop_id・plan を受け取り Checkout Session URL を返す）
- [ ] プラン選択 UI 実装（`/owner/subscribe`）
- [ ] Checkout Session への遷移処理
- **完了条件**: プラン選択 → Stripe Checkout 画面に遷移できる
- **依存**: Task 1.2
- **推定時間**: 3h

### Task 5.2: Stripe Webhook 処理

- [ ] `stripe-webhook` Edge Function 作成
- [ ] `customer.subscription.created` イベント処理（subscriptions INSERT）
- [ ] `customer.subscription.updated` イベント処理（status 同期）
- [ ] `customer.subscription.deleted` イベント処理（status → canceled）
- [ ] Webhook 署名検証（`STRIPE_WEBHOOK_SECRET`）
- **完了条件**: Stripe CLI でイベントを送信し、subscriptions テーブルが正しく更新される
- **依存**: Task 5.1
- **推定時間**: 3h

### Task 5.3: サブスク状態による権限制御

- [ ] Webhook 受信後 `users.role` を `shop_owner` に UPDATE する処理
- [ ] 解約・期間満了後 `users.role` を `user` に UPDATE する処理
- [ ] `current_period_end` を基準とした権限チェック（期間内なら有効）
- [ ] shop_owner 向けページでのサブスク期限表示
- **完了条件**: 決済完了でオーナー機能が有効化し、満了後に無効化される
- **依存**: Task 5.2
- **推定時間**: 2h

### Task 5.4: 領収書メール

- [ ] Resend アカウント設定・API キー取得
- [ ] `stripe-webhook` 内で `subscription.created` 時に Resend 経由で領収書メール送信
- [ ] 領収書メールテンプレート作成（金額・期間・店舗名）
- **完了条件**: 決済完了メールが届く
- **依存**: Task 5.2
- **推定時間**: 2h

---

## Phase 6: Edge Functions（残り2本）

### Task 6.1: notify-admin Edge Function

- [ ] `notify-admin` Edge Function 作成
- [ ] ブランド新規投稿時の運営通知メール（Resend）
- [ ] 掲載申請送信時の運営通知メール（Resend）
- [ ] Supabase DB Webhook から Edge Function をトリガーする設定
- **完了条件**: ブランド投稿・掲載申請で運営メールが届く
- **依存**: Task 5.4（Resend 設定済みのため）
- **推定時間**: 2h

### Task 6.2: ng-score-check Edge Function

- [ ] `ng-score-check` Edge Function 作成
- [ ] `ng_words` テーブルから全ワードを取得（service role）
- [ ] レビュー本文の NGスコア算出ロジック実装
- [ ] スコア ≥ 10 の場合 `status='flagged'` に自動変更
- [ ] Supabase DB Webhook（reviews INSERT）からトリガー設定
- [ ] 初期 NGワードデータ投入
- **完了条件**: NGワードを含むレビューが自動で flagged になる
- **依存**: Task 3.5
- **推定時間**: 3h

---

## Phase 7: 管理画面（admin）

### Task 7.1: 管理画面基盤

- [ ] admin 専用レイアウト作成（サイドバーナビ）
- [ ] 各セクションのバッジ通知（未処理件数表示）
- [ ] admin ルートの保護（role='admin' チェック）
- **完了条件**: admin でログイン後に管理画面に遷移できる
- **依存**: Task 1.6
- **推定時間**: 2h

### Task 7.2: 店舗管理（admin）

- [ ] `AdminShopsPage` 実装（店舗一覧・登録・ステータス変更）
- [ ] 新規店舗登録フォーム（admin のみ）
- [ ] 店舗名変更申請の承認・却下処理（`name_pending` → `name`）
- [ ] 店舗の公開/非公開切り替え
- **完了条件**: admin が店舗を登録・管理できる
- **依存**: Task 7.1
- **推定時間**: 3h

### Task 7.3: レビュー管理（admin）

- [ ] `AdminReviewsPage` 実装（flagged 優先表示・status フィルタ）
- [ ] レビューの非公開（`hidden`）・公開（`published`）切り替え
- [ ] 通報内容の確認
- **完了条件**: admin が flagged レビューを確認・対処できる
- **依存**: Task 7.1
- **推定時間**: 2h

### Task 7.4: ブランド管理（admin）

- [ ] `AdminBrandsPage` 実装（一覧・重複マージ）
- [ ] ブランドの重複マージ処理（`merged_into` 設定・shop_brands の付け替え）
- [ ] ブランドの正規名・別表記編集
- **完了条件**: admin がブランドの重複をマージできる
- **依存**: Task 7.1
- **推定時間**: 3h

### Task 7.5: 申請管理（admin）

- [ ] `AdminApplicationsPage` 実装（掲載申請・オーナー申請の一覧）
- [ ] 掲載申請の承認（店舗データ登録）・却下処理
- [ ] オーナー申請の承認（shop_staffs 紐付け）・却下処理
- [ ] 申請者へのメール通知（承認 / 却下）
- **完了条件**: admin が申請を承認・却下でき、申請者にメールが届く
- **依存**: Task 7.1, Task 6.1
- **推定時間**: 3h

### Task 7.6: サブスク管理（admin）

- [ ] `AdminSubscriptionsPage` 実装（サブスク一覧・ステータス確認）
- [ ] 手動で shop_owner ロールを付与・剥奪する操作（二重課金・決済障害対応）
- **完了条件**: admin がサブスク状況を確認・手動操作できる
- **依存**: Task 7.1, Task 5.3
- **推定時間**: 2h

---

## Phase 8: デプロイ・インフラ

<!-- ### Task 8.1: Cloudflare Pages 本番デプロイ -->

- [ ] Cloudflare Registrar で `fukunavi.com` を取得
- [ ] Cloudflare Pages プロジェクト作成・GitHub 連携
- [ ] ビルド設定（コマンド: `npm run build` / 出力: `dist`）
- [ ] 環境変数（`VITE_SUPABASE_URL` 等）を Cloudflare Pages に設定
- [ ] カスタムドメイン（`fukunavi.com`）設定
- **完了条件**: `fukunavi.com` で本番サイトが表示される
- **依存**: 全 Phase 完了後
- **推定時間**: 2h

<!-- ### Task 8.2: Supabase 本番環境設定 -->

- [ ] production プロジェクトに全マイグレーションを適用（`supabase db push --linked`）
- [ ] Google OAuth の本番リダイレクト URI 設定
- [ ] Stripe Webhook エンドポイントを本番 Edge Function URL に設定
- [ ] Edge Functions の環境変数（Supabase secrets）設定
- [ ] Storage バケットの本番設定確認
- **完了条件**: 本番環境で全機能が動作する
- **依存**: Task 8.1
- **推定時間**: 2h

---

## 実装順序

```
Phase 1（基盤）→ Phase 2（認証）→ Phase 3（一般機能）
                                      ↓
                              Phase 5（決済）→ Phase 4（店舗管理者）
                                      ↓
                              Phase 6（Edge Functions）
                                      ↓
                              Phase 7（管理画面）→ Phase 8（デプロイ）
```

**並行実行可能なタスク:**
- Task 1.1 と Task 1.2 は同時進行可
- Task 3.1〜3.3 は独立しているため並行可
- Task 5.4 と Task 6.1 は Resend 設定が共通なのでまとめて対応

---

## クリティカルパス

```
1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 2.1 → 3.5 → 6.2（NGフィルタ）
                                  ↓
                            5.1 → 5.2 → 5.3（権限制御）→ 4.2
```

最長経路は **基盤 → 認証 → レビュー → 課金 → 店舗管理** の順。

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| Supabase の `pg_bigm` 拡張が本番で有効化できない | 事前に staging で動作確認し、無効時は `ilike` 検索にフォールバック |
| Google OAuth の `linkIdentity` API の挙動が想定と異なる | staging で徹底的にテストしてから本番適用 |
| Stripe Webhook のイベント重複受信 | `stripe_subscription_id` の UNIQUE 制約でべき等処理 |
| ブランドデータの重複増加 | 類似検索の精度調整 + admin によるマージ運用でカバー |
| 初期店舗データが少なくユーザーが来ない | Phase 7 完了後、admin 機能で先に100件程度の店舗を登録してからリリース |

---

## 実装開始ガイド

1. このタスクリストに従って Phase 1 から順次実装を進めてください
2. 各タスクの開始時に TodoWrite で `in_progress` に更新
3. 完了時は `completed` に更新
4. 問題発生時は速やかに報告してください

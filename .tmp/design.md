# 詳細設計書 - フクナビ

---

## 1. アーキテクチャ概要

### 1.1 システム構成図

```
┌─────────────────────────────────────────────────────┐
│                   Browser (SPA)                      │
│           React + TypeScript + Vite                  │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│              Cloudflare Pages CDN                    │
│         (静的ファイル配信・帯域無制限)                  │
└───────────────────────┬─────────────────────────────┘
                        │ Supabase JS Client
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Supabase                           │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │   Auth   │  │PostgreSQL│  │    Storage      │   │
│  │(Google + │  │(RLS有効) │  │ (レビュー画像・  │   │
│  │ Email)   │  │+pg_bigm  │  │  店舗写真)      │   │
│  └──────────┘  └──────────┘  └─────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │   Edge Functions（外部連携のみ・3本）         │   │
│  │  stripe-webhook / notify-admin / ng-score   │   │
│  │  ※検索・レコメンドは PostgreSQL RPC で完結   │   │
│  └─────────────────────────────────────────────┘   │
└──────────┬────────────────────────┬────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐     ┌──────────────────────┐
│   Stripe API     │     │   Resend (メール)      │
│ (サブスク課金)    │     │ (通知・領収書・Auth)   │
└──────────────────┘     └──────────────────────┘
```

### 1.2 技術スタック

| 区分 | 技術 | 理由 |
|------|------|------|
| 言語 | TypeScript 5.x | 型安全性・保守性 |
| フレームワーク | React 19 + Vite | SPA、高速ビルド |
| スタイリング | Tailwind CSS v4 + shadcn/ui | 高速開発・一貫したデザイン |
| サーバー状態 | TanStack Query v5 | キャッシュ・再フェッチ管理 |
| UI状態 | Zustand | 軽量・シンプル |
| ルーティング | React Router v7 | SPA標準 |
| フォーム | React Hook Form + Zod | バリデーション統合 |
| BaaS | Supabase | Auth・DB・Storage・Edge Functions一体 |
| DB | PostgreSQL 15 + pg_bigm | 全文検索（日本語対応） |
| 決済 | Stripe | サブスクリプション管理 |
| メール | Resend | トランザクションメール |
| ホスティング | Cloudflare Pages | 帯域無制限・無料・グローバルCDN |

---

## 2. データベース設計

### 2.1 ER図（主要テーブル）

```
users ──────────────────────────────────────────────────────┐
  │ id, role, display_name, avatar_url                       │
  │                                                          │
  ├─── shop_staffs ─── shops                                │
  │      user_id          id, name, status                  │
  │      shop_id          area_id, price_range_id           │
  │      staff_role       search_vector(tsvector)            │
  │                       │                                  │
  │                       ├── shop_categories               │
  │                       ├── shop_brands ── brands         │
  │                       │                   id, name      │
  │                       │                   search_vector │
  │                       ├── shop_photos                   │
  │                       ├── shop_tags ── tags             │
  │                       └── reviews                       │
  │                             id, user_id                 │
  │                             status, ng_score            │
  │                             ├── review_photos           │
  │                             └── review_reports          │
  │
  ├─── favorites (user_id, shop_id)
  │
  ├─── wishes
  │      id, user_id, type
  │      category_id, price_range_id, area_id
  │      is_public, notify_email
  │
  ├─── shop_listing_requests
  │      (掲載申請)
  │
  ├─── owner_applications
  │      (オーナー申請)
  │
  └─── subscriptions
         shop_id, stripe_subscription_id
         plan, status
```

### 2.2 テーブル定義

#### users
```sql
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'user'
                check (role in ('user', 'shop_owner', 'admin')),
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

#### areas
```sql
create table public.areas (
  id         serial primary key,
  prefecture text not null,
  city       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);
```

#### price_ranges
```sql
create table public.price_ranges (
  id        serial primary key,
  label     text not null,  -- 例: ～5,000円
  min_price int,
  max_price int
);
```

#### shops
```sql
create table public.shops (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  name_pending     text,                -- 変更申請中の名前
  description      text,
  area_id          int references areas(id),
  price_range_id   int references price_ranges(id),
  phone            text,
  website_url      text,
  instagram_url    text,
  twitter_url      text,
  business_hours   jsonb,
  closed_days      text[],
  status           text not null default 'public'
                     check (status in ('public', 'private', 'pending')),
  search_vector    tsvector generated always as (
    to_tsvector('simple', coalesce(name, ''))
  ) stored,
  created_by       uuid references users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index shops_search_idx on shops using gin(search_vector);
-- pg_bigm を使った bigram インデックスも追加
create index shops_name_bigm_idx on shops using gin(name gin_bigm_ops);
```

> **備考**: `pg_bigm` は Supabase では拡張として有効化する。
> 店舗横断検索（店舗名・ブランド名・タグ）は Edge Function 内で
> `shops LEFT JOIN shop_brands JOIN brands` を `pg_bigm` で横断検索する。

#### brands
```sql
create table public.brands (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  name_kana    text,
  aliases      text[] default '{}',  -- 別表記
  submitted_by uuid references users(id),
  status       text not null default 'active'
                 check (status in ('active', 'merged')),
  merged_into  uuid references brands(id),
  search_vector tsvector generated always as (
    to_tsvector('simple',
      coalesce(name, '') || ' ' ||
      coalesce(name_kana, '') || ' ' ||
      coalesce(array_to_string(aliases, ' '), '')
    )
  ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index brands_search_idx on brands using gin(search_vector);
create index brands_name_bigm_idx on brands using gin(name gin_bigm_ops);
```

#### reviews
```sql
create table public.reviews (
  id        uuid primary key default gen_random_uuid(),
  shop_id   uuid not null references shops(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  body      text not null,
  rating    smallint not null check (rating between 1 and 5),
  status    text not null default 'published'
              check (status in ('published', 'flagged', 'hidden')),
  ng_score  int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)  -- 1ユーザー1店舗1レビュー
);
```

#### review_reports
```sql
create table public.review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  reported_by uuid not null references users(id),
  reason      text not null
                check (reason in ('false_info', 'harassment', 'irrelevant', 'other')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (review_id, reported_by)  -- 1ユーザー1レビュー1通報
);
```

#### wishes
```sql
create table public.wishes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  type           text not null check (type in ('brand', 'item', 'condition')),
  category_id    int not null references categories(id),
  price_range_id int not null references price_ranges(id),
  area_id        int not null references areas(id),
  size           text,
  tags           text[] default '{}',
  condition      text check (condition in ('new', 'used')),
  urgency        text check (urgency in ('low', 'medium', 'high')),
  note           text,
  is_public      bool not null default true,
  notify_email   bool not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
```

#### shop_listing_requests
```sql
create table public.shop_listing_requests (
  id               uuid primary key default gen_random_uuid(),
  submitted_by     uuid not null references users(id),
  shop_name        text not null,
  address          text,
  category_ids     int[],
  website_url      text,
  note             text,
  is_owner_request bool not null default false,
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected')),
  reviewed_by      uuid references users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

#### subscriptions
```sql
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  shop_id                 uuid not null references shops(id),
  user_id                 uuid not null references users(id),
  stripe_subscription_id  text unique,
  stripe_customer_id      text,
  plan                    text not null check (plan in ('monthly', 'yearly')),
  status                  text not null
                            check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
```

#### ng_words
```sql
create table public.ng_words (
  id    serial primary key,
  word  text not null unique,
  score int not null default 1
);
```

### 2.3 Row Level Security (RLS) 方針

| テーブル | 読み取り | 書き込み |
|---------|---------|---------|
| shops | status='public' は全員 | admin のみ INSERT/UPDATE |
| shop_staffs | 関連 shop_owner | admin のみ管理 |
| reviews | status='published' は全員 | 本人が INSERT/UPDATE、admin が status 変更 |
| review_reports | admin のみ | authenticated ユーザーが INSERT |
| wishes | is_public=true は全員、自分のは全件 | 本人のみ |
| favorites | 本人のみ | 本人のみ |
| brands | active は全員 | authenticated が INSERT、admin が UPDATE |
| subscriptions | 本人と admin | Edge Function (service role) のみ |
| shop_listing_requests | 本人と admin | authenticated が INSERT |
| ng_words | なし（サーバーサイドのみ） | admin のみ |

---

## 3. フロントエンド設計

### 3.1 ディレクトリ構成

```
src/
├── pages/
│   ├── top/
│   │   └── TopPage.tsx
│   ├── shops/
│   │   ├── ShopsPage.tsx          # 一覧
│   │   └── ShopDetailPage.tsx     # 詳細
│   ├── wishes/
│   │   ├── WishesPage.tsx         # 自分のウィッシュ一覧
│   │   └── WishNewPage.tsx        # 登録 + レコメンド結果
│   ├── mypage/
│   │   ├── MyPage.tsx
│   │   └── FavoritesPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── LinkAccountPage.tsx    # アカウント統合確認
│   ├── owner/                     # shop_owner 専用
│   │   ├── OwnerDashboardPage.tsx
│   │   ├── ShopEditPage.tsx
│   │   └── BrandsManagePage.tsx
│   └── admin/                     # admin 専用
│       ├── AdminShopsPage.tsx
│       ├── AdminReviewsPage.tsx
│       ├── AdminBrandsPage.tsx
│       ├── AdminApplicationsPage.tsx
│       └── AdminSubscriptionsPage.tsx
├── components/
│   ├── ui/                        # shadcn/ui ベース
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── shop/
│   │   ├── ShopCard.tsx
│   │   ├── ShopFilters.tsx
│   │   └── ShopSearchBar.tsx
│   ├── review/
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewForm.tsx
│   │   └── ReviewReportModal.tsx
│   ├── wish/
│   │   ├── WishForm.tsx
│   │   └── WishRecommendList.tsx
│   ├── brand/
│   │   ├── BrandSearchInput.tsx   # リアルタイム類似検索
│   │   └── BrandTag.tsx
│   └── layout/
│       ├── Layout.tsx
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/
│   ├── useShops.ts
│   ├── useShop.ts
│   ├── useReviews.ts
│   ├── useWishes.ts
│   ├── useBrands.ts
│   ├── useFavorites.ts
│   └── useAuth.ts
├── lib/
│   ├── supabase.ts                # Supabase クライアント
│   ├── stripe.ts                  # Stripe クライアント
│   └── ngwords.ts                 # NGスコア計算
├── store/
│   └── uiStore.ts                 # Zustand（モーダル・フィルタ状態）
└── types/
    └── index.ts                   # 全型定義
```

### 3.2 ルーティング設計

```
/                          トップ（未ログイン可）
/shops                     店舗一覧（未ログイン可）
/shops/:id                 店舗詳細（未ログイン可）
/auth/login                ログイン
/auth/register             新規登録
/auth/link-account         アカウント統合確認（OAuth衝突時）
/mypage                    マイページ（要ログイン）
/mypage/favorites          お気に入り（要ログイン）
/wishes                    ウィッシュ一覧（要ログイン）
/wishes/new                ウィッシュ登録（要ログイン）
/owner/dashboard           オーナーダッシュボード（要 shop_owner）
/owner/shops/:id           店舗編集（要 shop_owner）
/owner/shops/:id/brands    ブランド管理（要 shop_owner）
/admin/*                   管理画面（要 admin）
```

### 3.3 型定義

```typescript
// types/index.ts

export type UserRole = 'user' | 'shop_owner' | 'admin'
export type ShopStatus = 'public' | 'private' | 'pending'
export type ReviewStatus = 'published' | 'flagged' | 'hidden'
export type WishType = 'brand' | 'item' | 'condition'
export type WishUrgency = 'low' | 'medium' | 'high'
export type WishCondition = 'new' | 'used'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type ReportReason = 'false_info' | 'harassment' | 'irrelevant' | 'other'
export type CategoryCode = 'mens' | 'ladies' | 'kids' | 'unisex' | 'vintage'
export type ListingRequestStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface Area {
  id: number
  prefecture: string
  city: string
  slug: string
}

export interface PriceRange {
  id: number
  label: string
  minPrice: number | null
  maxPrice: number | null
}

export interface Category {
  id: number
  code: CategoryCode
  name: string
}

export interface Shop {
  id: string
  name: string
  namePending: string | null
  description: string | null
  area: Area | null
  priceRange: PriceRange | null
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  businessHours: BusinessHours | null
  closedDays: string[]
  status: ShopStatus
  categories: Category[]
  tags: Tag[]
  brands: Brand[]
  photos: ShopPhoto[]
  reviewCount: number
  averageRating: number | null
  createdAt: string
}

export interface Brand {
  id: string
  name: string
  nameKana: string | null
  aliases: string[]
  status: 'active' | 'merged'
  createdAt: string
}

export interface Review {
  id: string
  shopId: string
  userId: string
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>
  body: string
  rating: number
  status: ReviewStatus
  photos: ReviewPhoto[]
  createdAt: string
  updatedAt: string
}

export interface Wish {
  id: string
  userId: string
  type: WishType
  category: Category
  priceRange: PriceRange
  area: Area
  size: string | null
  tags: string[]
  condition: WishCondition | null
  urgency: WishUrgency | null
  note: string | null
  isPublic: boolean
  notifyEmail: boolean
  createdAt: string
}

export interface ShopRecommend {
  shop: Shop
  matchedConditions: string[]  // 例: ['キッズ対応', '渋谷エリア', '～5,000円']
}

export interface BusinessHours {
  [day: string]: { open: string; close: string } | null
}

export interface ShopFilters {
  areaId?: number
  categoryId?: number
  priceRangeId?: number
  tagIds?: number[]
  brandId?: string
  query?: string
  sort?: 'popular' | 'newest' | 'rating'
}
```

---

## 4. APIインターフェース

### 4.1 Supabase クエリ（主要パターン）

#### 店舗一覧（フィルタ + 全文検索）
```typescript
// pg_bigm による横断検索
const searchShops = async (filters: ShopFilters) => {
  let query = supabase
    .from('shops')
    .select(`
      *,
      area:areas(*),
      price_range:price_ranges(*),
      categories:shop_categories(category:categories(*)),
      brands:shop_brands(brand:brands(*)),
      tags:shop_tags(tag:tags(*)),
      photos:shop_photos(*),
      reviews(rating)
    `)
    .eq('status', 'public')

  if (filters.query) {
    // pg_bigm の LIKE 検索（インデックス利用）
    query = query.or(
      `name.ilike.%${filters.query}%,` +
      `description.ilike.%${filters.query}%`
    )
    // ブランド名・タグも横断するため RPC を使用
    // → supabase.rpc('search_shops', { query: filters.query, ... })
  }
  if (filters.areaId) query = query.eq('area_id', filters.areaId)
  if (filters.categoryId) {
    query = query.in('id',
      supabase.from('shop_categories')
        .select('shop_id')
        .eq('category_id', filters.categoryId)
    )
  }
  // ... 他フィルタ
}
```

#### ウィッシュ登録直後レコメンド（Edge Function）
```typescript
// Edge Function: recommend-shops
// カテゴリ・価格帯・エリアの完全一致で上位10件取得
const getRecommendedShops = async (wish: Wish): Promise<ShopRecommend[]> => {
  const { data } = await supabase.rpc('get_wish_recommendations', {
    p_category_id: wish.category.id,
    p_price_range_id: wish.priceRange.id,
    p_area_id: wish.area.id,
  })
  return data
}
```

```sql
-- PostgreSQL RPC
create or replace function get_wish_recommendations(
  p_category_id int,
  p_price_range_id int,
  p_area_id int
)
returns table (shop_id uuid, matched_count int)
language sql stable as $$
  select s.id, (
    (s.price_range_id = p_price_range_id)::int +
    (s.area_id = p_area_id)::int +
    exists(
      select 1 from shop_categories sc
      where sc.shop_id = s.id and sc.category_id = p_category_id
    )::int
  ) as matched_count
  from shops s
  where s.status = 'public'
    and s.area_id = p_area_id          -- エリア必須一致
    and s.price_range_id = p_price_range_id  -- 価格帯必須一致
    and exists(
      select 1 from shop_categories sc
      where sc.shop_id = s.id and sc.category_id = p_category_id
    )                                  -- カテゴリ必須一致
  order by matched_count desc
  limit 10;
$$;
```

### 4.2 Edge Functions

| Function | トリガー | 処理 |
|----------|---------|------|
| `stripe-webhook` | Stripe イベント | サブスク状態同期・領収書メール送信 |
| `notify-admin` | DB INSERT (brands, listing_requests) | 運営へメール通知 |
| `ng-score-check` | review INSERT/UPDATE の前処理 | NGスコア算出・自動フラグ |

#### NGスコア計算ロジック
```typescript
// lib/ngwords.ts（クライアント側でも利用可能な軽量版）
export const calcNgScore = (text: string, ngWords: NgWord[]): number => {
  return ngWords.reduce((score, ng) => {
    const regex = new RegExp(ng.word, 'gi')
    const matches = text.match(regex)
    return score + (matches ? matches.length * ng.score : 0)
  }, 0)
}

// スコア閾値: 10以上で status='flagged' に自動変更
const NG_SCORE_THRESHOLD = 10
```

---

## 5. 認証フロー設計

### 5.1 通常ログイン

```
ユーザー → ログインフォーム送信
  → Supabase Auth (signInWithPassword / signInWithOAuth)
  → auth.users に存在確認
  → public.users.role 確認
  → role に応じてリダイレクト
      user       → /
      shop_owner → /owner/dashboard
      admin      → /admin
```

### 5.2 アカウント統合フロー（メール登録済み + Google）

```
ユーザー → Google OAuth ログイン試行
  → Supabase が同一メールアドレスを検出
  → /auth/link-account へリダイレクト（state に Google token 保持）
  → 「既存アカウントが見つかりました」画面表示
  → 本人確認: パスワード入力 or メールOTP送信
  → 確認成功 → Supabase identities にGoogle identity をリンク
  → 通常ログイン完了フローへ
```

### 5.3 保護ルート

```typescript
// components/auth/ProtectedRoute.tsx
const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole?: UserRole
}) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/auth/login" />
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />
  return <>{children}</>
}
```

---

## 6. 決済フロー設計（Stripe）

```
店舗オーナー → プラン選択（月額 / 年額）
  → Stripe Checkout Session 作成（Edge Function）
  → Stripe 決済画面
  → 決済完了
  → Stripe Webhook → Edge Function (stripe-webhook)
      subscription.created → subscriptions テーブル INSERT
      → users.role を 'shop_owner' に UPDATE
      → shop_staffs にオーナー紐付け INSERT
      → 領収書メール（Resend）
  → /owner/dashboard にリダイレクト

解約・期間満了:
  → Stripe Webhook → subscription.deleted / subscription.updated
  → subscriptions.status を 'canceled' に UPDATE
  → users.role を 'user' に UPDATE（有効期限切れ後）
```

---

## 7. エラーハンドリング

### 7.1 エラー分類と対処

| エラー種別 | 対処 |
|-----------|------|
| 認証エラー（401） | ログインページへリダイレクト |
| 権限エラー（403） | トップへリダイレクト + トースト通知 |
| バリデーションエラー | フォームインライン表示 |
| ネットワークエラー | リトライ付きトースト通知 |
| Stripe 決済エラー | エラーメッセージ表示（Stripe 提供文言） |
| NGワードフラグ | 「一部表現が含まれています」として投稿は通す（スコア記録） |

### 7.2 エラー通知方針

- ユーザー向け: トースト通知（shadcn/ui Toaster）
- 開発者向け: Supabase ログ + console.error（本番は Sentry 導入を推奨）
- 管理者向け: flagged レビュー・申請は管理画面のバッジで通知

---

## 8. セキュリティ設計

### 8.1 認証・認可

- 全 DB 操作は RLS を通す（service role は Edge Function 内のみ使用）
- admin ロールの付与は直接 DB 操作のみ（UI からは不可）
- shop_owner への昇格は Stripe Webhook 経由のみ（自己昇格不可）
- 重要操作（メール変更・退会）は再認証必須

### 8.2 入力値検証

- クライアント: Zod スキーマでバリデーション
- サーバー: PostgreSQL CHECK 制約 + RLS Policy
- ファイルアップロード: Supabase Storage の MIME type チェック（image/* のみ）
- レビュー本文: NGスコア計算（クライアント + Edge Function 二重チェック）

### 8.3 CSRF・XSS

- Supabase JS Client は CSRF トークンを自動管理
- React の JSX は XSS をデフォルト防止（dangerouslySetInnerHTML 使用禁止）
- Stripe は公式 JS SDK 経由のみ利用（カード情報を自サービスに通さない）

---

## 9. パフォーマンス最適化

### 9.1 クエリ最適化

- 店舗一覧: GIN インデックス（search_vector, name gin_bigm_ops）
- お気に入り数・平均評価は shops テーブルに集計カラムを持ち、
  review/favorite INSERT 時にトリガーで更新（集計クエリを避ける）
- ページング: cursor-based pagination（`created_at` + `id` での keyset）

```sql
-- 集計カラム（トリガー更新）
alter table shops add column review_count int not null default 0;
alter table shops add column average_rating numeric(3,2);
alter table shops add column favorite_count int not null default 0;
```

### 9.2 フロントエンド最適化

- TanStack Query でサーバー状態キャッシュ（staleTime: 5分）
- 画像: Supabase Storage の transform API でリサイズ（WebP変換）
- 無限スクロール or ページネーション（20件/ページ）
- コード分割: React.lazy + Suspense（ページ単位）

---

## 10. デプロイメント

### 10.1 環境構成

| 環境 | フロントエンド | バックエンド |
|------|--------------|-------------|
| 開発 | localhost:5173 | Supabase Local (supabase start) |
| ステージング | Cloudflare Pages Preview（PR自動デプロイ） | Supabase staging project |
| 本番 | Cloudflare Pages Production | Supabase production project |

**Cloudflare Pages デプロイ設定:**
- ビルドコマンド: `npm run build`
- 出力ディレクトリ: `dist`
- SPA ルーティング: `_redirects` ファイルで `/* /index.html 200` を設定

**ドメイン:**
- `fukunavi.com`（Cloudflare Registrar で取得・約¥1,500/年・更新料固定）
- DNS は Cloudflare が自動管理（Cloudflare Pages とワンクリック連携）

### 10.2 環境変数

```bash
# .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=

# Edge Functions（Supabase secrets）
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

### 10.3 Supabase マイグレーション管理

```bash
supabase migration new create_shops_table
supabase db push              # ステージング
supabase db push --linked     # 本番
```

---

## 11. 実装上の注意事項

- **バックエンド方針**: 検索・レコメンドは PostgreSQL RPC で完結させる。Edge Functions は Stripe Webhook・Resend メール・NGスコア計算の3本のみ。自前バックエンドサーバーは不要（Supabase と Cloudflare Pages で完結）
- **Cloudflare Pages の SPA ルーティング**: `public/_redirects` に `/* /index.html 200` を追加しないと、直接URL アクセス時に 404 になる
- `pg_bigm` は Supabase の拡張有効化画面から ON にする（`create extension pg_bigm`）
- アカウント統合フローは Supabase Auth の `linkIdentity` API を使用する。Supabase の設定で "Link identity with email" を無効化し、必ずアプリ側の確認ステップを経由させること
- Stripe の `subscription.deleted` イベントは即時ではなく期間満了時に発火するケースがあるため、`current_period_end` を基準に権限チェックする
- NGワードテーブルは公開 RLS を設けず、Edge Function の service role 経由でのみ取得する（ユーザーがワードを把握してのう回を防ぐ）
- 店舗写真・レビュー画像のストレージパスは `shops/{shop_id}/{uuid}.webp` の形式で統一し、Storage Policy で shop_owner のみ自店舗フォルダに書き込み可とする

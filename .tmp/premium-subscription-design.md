# プレミアム会員サブスク 設計書

## アーキテクチャ概要

```
フロントエンド（React）
  ↓ supabase.functions.invoke()
Edge Functions（Deno）
  ↓ Stripe SDK
Stripe API
  ↓ Webhook
Edge Function: stripe-webhook
  ↓ supabase-service-role
user_subscriptions テーブル（PostgreSQL）
```

---

## DB設計

### user_subscriptions テーブル

```sql
create table public.user_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  plan                   text not null check (plan in ('monthly', 'yearly')),
  status                 text not null
    check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
```

### RLS

- SELECT: `user_id = auth.uid() OR is_admin()`
- INSERT/UPDATE/DELETE: service_role のみ（ポリシーなし = 拒否）

---

## Edge Functions 設計

### 1. create-checkout-session

**トリガー**: ユーザーが「プレミアムに登録する」ボタンを押す

**処理**:
1. JWT 検証 → user_id 取得
2. Stripe Customer 存在確認（stripe_customer_id が既にあれば再利用）
3. `stripe.checkout.sessions.create()` で Session 作成
4. Session URL を返す

**リクエスト**:
```json
{ "plan": "monthly" | "yearly" }
```

**レスポンス**:
```json
{ "url": "https://checkout.stripe.com/..." }
```

**環境変数**:
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_YEARLY`

### 2. create-portal-session

**トリガー**: ユーザーが「プランを管理する」ボタンを押す

**処理**:
1. JWT 検証 → user_id 取得
2. user_subscriptions から stripe_customer_id 取得
3. `stripe.billingPortal.sessions.create()` で Portal Session 作成
4. Portal URL を返す

**レスポンス**:
```json
{ "url": "https://billing.stripe.com/..." }
```

### 3. stripe-webhook

**トリガー**: Stripe からの Webhook

**処理イベント**:
| イベント | 処理 |
|---------|------|
| `checkout.session.completed` | user_subscriptions を INSERT/UPSERT |
| `customer.subscription.updated` | status, plan, period を UPDATE |
| `customer.subscription.deleted` | status を 'canceled' に UPDATE, canceled_at を記録 |
| `invoice.payment_failed` | status を 'past_due' に UPDATE |

**セキュリティ**:
- `stripe.webhooks.constructEvent()` で署名検証
- `STRIPE_WEBHOOK_SECRET` 環境変数

---

## フロントエンド設計

### ルーティング

| パス | コンポーネント | 説明 |
|-----|---------------|------|
| `/mypage/subscription` | SubscriptionPage | サブスク状態表示・購入 |

success/cancel は query param で処理（同一ページ内）

### ページ構成: SubscriptionPage

**Free ユーザー時**:
- 現在のプラン: Free と表示
- プラン比較テーブル（Free vs Premium）
- 月額/年額 トグル
- 「プレミアムに登録する」ボタン → create-checkout-session → redirect

**Premium ユーザー時**:
- 現在のプラン: Premium と表示
- ステータス（active / past_due / canceled）
- 次回請求日
- 「プランを管理する」ボタン → create-portal-session → redirect

**?success=true 時**:
- 購入完了バナー表示

**?canceled=true 時**:
- キャンセルメッセージ表示（購入は完了していない旨）

### Hook: useUserSubscription

```typescript
const { subscription, isPremium, isLoading } = useUserSubscription()
```

- `subscription`: UserSubscription | null
- `isPremium`: subscription?.status === 'active' || === 'trialing'
- React Query でキャッシュ管理

---

## 型定義

```typescript
export type UserSubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type UserSubscriptionPlan = 'monthly' | 'yearly'

export interface UserSubscription {
  id: string
  userId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  plan: UserSubscriptionPlan
  status: UserSubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}
```

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `STRIPE_SECRET_KEY` | Stripe シークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Webhook 署名検証用 |
| `STRIPE_PRICE_ID_MONTHLY` | 月額プラン Price ID |
| `STRIPE_PRICE_ID_YEARLY` | 年額プラン Price ID |

---

## Stripe 設定必要事項

1. Stripe ダッシュボードで Product・Price を作成
2. Webhook エンドポイントを登録（`/functions/v1/stripe-webhook`）
3. Customer Portal を有効化
4. 環境変数を Supabase Edge Function に設定

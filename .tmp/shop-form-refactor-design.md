# 設計書: 店舗登録/編集フォームの共通コンポーネント化

## 概要

fukunaviには店舗フォーム関連のページが3つ存在し、約1,000行以上のUI・ロジックが重複している。Zodスキーマ、各セクション（基本情報/住所/価格帯/カテゴリ/連絡先/SNS/ステータス/営業時間）、ヘッダー、サブミットボタンなどを共通化し、保守性と一貫性を向上させる。

## 調査結果サマリー

### 店舗フォーム関連ファイル

| ファイル | 行数 | 役割 |
|---|---|---|
| `src/pages/admin/AdminShopNewPage.tsx` | 509行 | 管理者：新規登録（写真はpendingファイル＋登録時アップロード） |
| `src/pages/admin/AdminShopEditPage.tsx` | 642行 | 管理者：編集（ステータス含む、サイドバー付き、営業時間あり） |
| `src/pages/owner/OwnerShopEditPage.tsx` | 502行 | オーナー：編集（ステータスなし、サイドバー付き、営業時間あり、descriptionカウンタあり） |

### 既存の共通コンポーネント (`src/components/shop/`)

- `ShopFormUI.tsx`: `SectionLabel`, `Field`, `inputClass`, `selectClass`（65行）
- `ShopBusinessHoursSection.tsx`: 営業時間セクション、`businessHoursSchema`、変換ヘルパー
- `ShopPhotoSection.tsx`: 既存店舗用写真管理（useShop経由 / Supabase直接）
- `ShopPhotoUploadInput.tsx`: ファイル入力UI

### 共通化対象（重複箇所）

1. **Zodスキーマ**: `name/description/prefectureId/cityId/address/priceRangeId/categoryIds/phone/websiteUrl/instagramUrl/twitterUrl/tiktokUrl` が3ファイルでほぼ同一定義
2. **`shopToFormValues` ヘルパー**: AdminShopEditPage と OwnerShopEditPage でほぼ同一
3. **セクション01〜07のJSX**: 基本情報/住所/価格帯/カテゴリ/連絡先/SNS 各セクションが3ファイルで重複
4. **`toggleCategory`, `citiesForPrefecture`, `watchedPrefectureId`** ロジック
5. **ヘッダー（EDIT/CREATE 背景テキスト付き）**: 3ファイルで類似
6. **サブミットボタン + Status カード（サイドバー）**: Admin/Owner Edit で重複
7. **STATUS_OPTIONS（public/pending/private 選択UI）**: Admin New/Edit で重複
8. **SNS入力 + アイコン（Instagram/X/TikTok）**: 3ファイルで重複

## 要件

### 機能要件

- 店舗フォームを1つの共通コンポーネント（`ShopForm`）として提供し、`new`/`edit` モードおよび `admin`/`owner` のコンテキストを切り替えられる
- ステータスフィールドの有無を制御可能にする（オーナーは操作不可）
- 営業時間の有無（新規登録では不要）を制御可能にする
- サイドバーの表示を制御可能にする
- onSubmit コールバックで上位ページが Supabase ミューテーションを制御する（共通化しすぎない）
- 既存の振る舞い（バリデーションメッセージ・プレースホルダ・デフォルト値）を完全に維持

### 非機能要件

- 既存ページの見た目・動作を**破壊しない**
- 共通化後も react-hook-form の型推論が崩れない（`any` 禁止）
- 1ファイルあたり 400行以下を目安に分割

## アーキテクチャ設計

### 新規ファイル構成

```
src/components/shop/form/
├── shopFormSchema.ts             # Zodスキーマ + 型 + helper(shopToFormValues)
├── ShopForm.tsx                  # フォーム全体のorchestrator (<300行)
├── ShopFormHeader.tsx            # 共通ヘッダー (EDIT/CREATE 背景テキスト)
├── ShopFormStatusCard.tsx        # サイドバーの Save + isDirty 表示
└── sections/
    ├── BasicInfoSection.tsx      # 01 名前 + 説明 (descriptionカウンタ optional)
    ├── AddressSection.tsx        # 02 都道府県/市区町村/住所
    ├── PriceRangeSection.tsx     # 03 価格帯
    ├── CategoriesSection.tsx     # 04 カテゴリトグル
    ├── ContactSection.tsx        # 06 連絡先 (電話/公式サイト)
    ├── SnsSection.tsx            # 07 SNS (Instagram/X/TikTok)
    └── StatusSection.tsx         # 08 ステータス (public/pending/private)
```

※ `ShopFormUI.tsx`, `ShopBusinessHoursSection.tsx`, `ShopPhotoSection.tsx`, `ShopPhotoUploadInput.tsx` は既存のまま継続利用。

### コンポーネントAPI設計

```typescript
interface ShopFormProps {
  mode: 'new' | 'edit'
  showStatus: boolean           // owner=false
  showBusinessHours: boolean    // newでは false
  showSidebar: boolean          // newでは false
  defaultValues?: Partial<ShopFormValues>
  masterData: ShopMasterData
  photoSlot?: ReactNode         // ShopPhotoSection (edit) or PendingPhotos (new)
  onSubmit: (values: ShopFormValues) => void | Promise<void>
  isPending: boolean
  errorMessage?: string
  headerProps: {
    backText: 'CREATE' | 'EDIT'
    title: string
    backLink: string
    context: 'admin' | 'owner'
  }
}
```

- フォームの `useForm` は `ShopForm` 内で管理し、`onSubmit` で値を親に渡す
- `FormProvider`（react-hook-form）を使い、セクションで `useFormContext` で参照

## 実装フェーズ

### フェーズ1: スキーマとヘルパー抽出（リスク: 低）

**`src/components/shop/form/shopFormSchema.ts` 作成**
- `shopFormSchema`（全共通フィールド + `businessHours` + `status` を `.optional()` ベースで包括）を定義
- `ShopFormValues` 型をエクスポート
- `shopToFormValues` ヘルパーを移植
- リスク: 低（純粋ロジック、型エラーは tsc で検知可能）

### フェーズ2: セクションコンポーネント切り出し（リスク: 低〜中）

各セクションは互いに独立しているため**並列実装可能**。

| ファイル | 内容 | リスク |
|---|---|---|
| `BasicInfoSection.tsx` | 名前/説明。`showDescriptionCounter` オプション追加（Owner向け） | 低 |
| `AddressSection.tsx` | 都道府県/市区町村/番地。`masterData` と `watchedPrefectureId` を props で受ける | 低 |
| `PriceRangeSection.tsx` | 価格帯選択 | 低 |
| `CategoriesSection.tsx` | トグルUI + `toggleCategory` 関数を内包 | 低 |
| `ContactSection.tsx` | 電話 + 公式サイト（アイコン付き） | 中（微小な視覚差の統合） |
| `SnsSection.tsx` | Instagram/X/TikTok 入力 | 低 |
| `StatusSection.tsx` | STATUS_OPTIONS を内部化。`sublabels` を props で受ける | 低 |

### フェーズ3: ヘッダー/サイドバー切り出し（リスク: 低）

- **`ShopFormHeader.tsx`**: 背景big text + 戻るリンク + タイトル
- **`ShopFormStatusCard.tsx`**: Save ボタン + isDirty 状態表示

### フェーズ4: `ShopForm.tsx` orchestrator 作成（リスク: 中）

- `useForm` + `FormProvider` + セクション配列レンダリング
- `photoSlot` を props で受けて写真セクションを差し込む
- `mode/showStatus/showBusinessHours/showSidebar` で分岐

### フェーズ5: 既存ページの置き換え（リスク: 中〜高）

1. `AdminShopNewPage.tsx` → mutation のみ残し、`<ShopForm mode="new" showStatus showBusinessHours={false}>`に置換
2. `AdminShopEditPage.tsx` → mutation + ShopPhotoSection + サイドバー（クイックリンク）を残し、`<ShopForm mode="edit" showStatus showBusinessHours>` に置換
3. `OwnerShopEditPage.tsx` → `<ShopForm mode="edit" showStatus={false} showBusinessHours>` に置換

### フェーズ6: 検証・クリーンアップ（リスク: 低）

- `npm run typecheck && npm run lint` 実行
- 手動 E2E 確認（Admin新規/編集、Owner編集）
- 不要コードの削除（旧 STATUS_OPTIONS, shopToFormValues 等）

## 依存関係

```
フェーズ1 (schema)
  ↓
フェーズ2 (sections) ← 並列実装可
フェーズ3 (header/sidebar) ← 並列実装可
  ↓
フェーズ4 (ShopForm orchestrator)
  ↓
フェーズ5 (page移行) ← 1ページずつ安全に
  ↓
フェーズ6 (検証)
```

## リスクと緩和策

| リスク | 緩和策 |
|---|---|
| react-hook-form の型推論崩壊 | `FormProvider` + `useFormContext<ShopFormValues>()` で型付け |
| セクション番号が異なる（写真=05, 営業時間=08 or 09） | セクション番号を props 化 |
| 新規登録ページの写真管理が特殊（登録前プレビュー） | 写真セクションは `photoSlot` で外部から差し込む設計 |
| 微妙なクラス名の差異 | 移行前にスクリーンショット比較。props で切り替えるか統一を判断 |
| Owner版のみ description 文字数カウンタあり | `BasicInfoSection` に `showDescriptionCounter?: boolean` を追加 |
| ステータスの sublabel が new/edit で異なる | `StatusSection` に `sublabels` を props で受ける |

## 規模見積もり

| フェーズ | 規模 | 複雑度 |
|---|---|---|
| 1. schema | 1ファイル, ~100行 | 小 |
| 2. sections | 7ファイル, 各50〜100行 | 中 |
| 3. header/sidebar | 2ファイル, 各80行 | 小 |
| 4. ShopForm | 1ファイル, ~250行 | 中 |
| 5. page移行 | 3ファイル改修 | 中 |
| 6. 検証 | - | 小 |

**効果**: 重複コード 1,000行超 → 共通コンポーネント 600〜700行 + 各ページ 150〜200行 に圧縮見込み

## 成功基準

- [ ] 3ページが `ShopForm` を利用して実装される
- [ ] `shopFormSchema` が1箇所で定義される
- [ ] 既存の全バリデーション・プレースホルダ・デフォルト値が維持される
- [ ] `any` / `unknown` が導入されない
- [ ] Admin新規/編集, Owner編集の全フローが動作する
- [ ] 各ページの行数が 200行以下まで削減される
- [ ] 型チェックとLintが全てパスする

## 確認事項

1. オーナー向け新規登録ページは現状存在しないが、今回のリファクタ対象に含めるか（現状は Admin新規 + Admin/Owner編集の3ページのみ）
2. 写真セクションを props slot で外部注入する方針（新規=pending, 編集=既存UI）で問題ないか

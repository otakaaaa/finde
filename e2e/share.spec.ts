import { test, expect } from '@playwright/test'

/**
 * シャレ活：公開（未ログイン）フローの E2E。
 * ローカル Supabase に公開投稿が存在する前提（無い場合は空状態を検証）。
 */
test.describe('シャレ活タイムライン（公開）', () => {
  test('タイムラインが表示され、タブを切り替えられる', async ({ page }) => {
    await page.goto('/share')

    await expect(page.getByRole('heading', { name: 'シャレ活' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'おすすめ' })).toBeVisible()
    await expect(page.getByRole('button', { name: '新着' })).toBeVisible()

    await page.getByRole('button', { name: '新着' }).click()
    // 切り替え後もフィード領域が描画されていること（投稿0件でも空表示が出る）
    await expect(page.getByRole('link', { name: /投稿する/ })).toBeVisible()
  })

  test('未ログインで投稿ページに行くとログインへ誘導される', async ({ page }) => {
    await page.goto('/share/new')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

/**
 * 認証必須フロー（投稿→公開→シャレ度→コメント→ブックマーク）。
 *
 * 本アプリの認証は Google OAuth のため、ブラウザ操作での自動ログインは現実的でない。
 * 実行するには Supabase のテストセッションをプログラムで注入する仕組み
 * （例：service-role でテストユーザー作成→ magic link / signInWithPassword でトークン取得→
 *  page.addInitScript で localStorage にセッションを seed）を用意すること。
 * セットアップ未整備のため、ここではスキップして手順を残す。
 */
test.describe('シャレ活 投稿フロー（要・認証セットアップ）', () => {
  test.skip('投稿を公開しタイムラインに表示される', async () => {
    // 1. テストユーザーのセッションを注入
    // 2. /share/new で本文・画像・公開範囲を入力し「公開する」
    // 3. /share/:id に遷移し本文が表示される
    // 4. 別ユーザーでシャレ度送信・コメント・ブックマーク
    // 5. 非公開投稿が第三者に「見つかりません」になることを確認
  })
})

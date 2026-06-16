import { defineConfig, devices } from '@playwright/test'

/**
 * E2E はローカルの dev サーバ + ローカル Supabase（npm run supabase:reset 済み）を前提とする。
 * 実行: npm run supabase:start && npm run dev を起動した状態で `npm run test:e2e`
 *       （webServer 設定により未起動なら自動起動）
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

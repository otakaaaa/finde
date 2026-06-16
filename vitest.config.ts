import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// E2E（Playwright）とは分離し、ユニット/コンポーネントテストのみ対象にする。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
})

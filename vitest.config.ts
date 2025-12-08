import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Use node for unit tests (faster), jsdom only when needed
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.{test,spec}.{jsx,tsx}', 'node_modules'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})


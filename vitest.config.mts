import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Builds test files with SWC so `emitDecoratorMetadata` works for Nest's DI.
    swc.vite({
      module: { type: 'es6' }
    })
  ],
  test: {
    // Explicit `import { describe, it, expect, vi } from 'vitest'` in test files instead of global injection.
    globals: false,
    root: './',
    environment: 'node',
    include: ['libs/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['libs/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/public-api.ts']
    }
  }
});

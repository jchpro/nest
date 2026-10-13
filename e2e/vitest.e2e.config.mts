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
    globals: false,
    root: import.meta.dirname,
    environment: 'node',
    include: ['tests/**/*.e2e.test.ts'],
    // One MongoDB replica set for the whole run, each test file uses its own database
    globalSetup: ['./global-setup.ts'],
    // The first run may need to start a downloaded `mongod`
    hookTimeout: 120_000,
    testTimeout: 30_000
  }
});

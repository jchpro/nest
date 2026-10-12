import { describe, expect, it } from 'vitest';
import { isMigrationFile } from './migration-files.js';

describe('isMigrationFile', () => {
  it('accepts generated migration file names', () => {
    expect(isMigrationFile('2026-10-11-120000_move_subscriptions.ts')).toBe(true);
  });

  it('rejects test files and other files', () => {
    expect(isMigrationFile('2026-10-11-120000_move_subscriptions.test.ts')).toBe(false);
    expect(isMigrationFile('helpers.ts')).toBe(false);
    expect(isMigrationFile('2026-10-11-120000_move_subscriptions.d.ts')).toBe(false);
  });
});

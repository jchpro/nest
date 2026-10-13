import { randomUUID } from 'node:crypto';
import { inject } from 'vitest';

/**
 * Connection string of a database of its own, so test files don't see each other's data.
 */
export function uniqueDatabaseUri(name = 'e2e'): string {
  return inject('mongoUri').replace('/?', `/${name}-${randomUUID()}?`);
}

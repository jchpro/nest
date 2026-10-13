import { describe, expect, it, vi } from 'vitest';
import { Migrator } from './migrator.js';

function setup(options: {
  acquired?: boolean;
  changelog?: { identifier: string }[];
  migrations: { id: string; up: () => Promise<void> }[];
}) {
  const service = {
    connection: { db: {}, getClient: () => ({}) },
    logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    migrations: options.migrations.map((m) => ({ id: m.id, migrate: { up: m.up } })),
    acquireLock: vi.fn().mockResolvedValue(options.acquired ?? true),
    releaseLock: vi.fn().mockResolvedValue(true),
    getChangelog: vi.fn().mockResolvedValue(options.changelog ?? []),
    logMigration: vi.fn().mockResolvedValue(undefined),
  };
  const app = { get: () => service } as any;
  return { service, migrator: new Migrator(app) };
}

describe('Migrator', () => {
  it('should run pending migrations and release the lock', async () => {
    const up = vi.fn().mockResolvedValue(undefined);
    const { migrator, service } = setup({
      changelog: [{ identifier: 'a' }],
      migrations: [{ id: 'a', up: vi.fn() }, { id: 'b', up }],
    });

    await migrator.up();

    expect(up).toHaveBeenCalledTimes(1);
    expect(service.logMigration).toHaveBeenCalledTimes(1);
    expect(service.releaseLock).toHaveBeenCalledTimes(1);
  });

  it('should return normally when the lock is not acquired', async () => {
    const up = vi.fn();
    const { migrator, service } = setup({ acquired: false, migrations: [{ id: 'a', up }] });

    await expect(migrator.up()).resolves.toBeUndefined();

    expect(up).not.toHaveBeenCalled();
    expect(service.releaseLock).not.toHaveBeenCalled();
  });

  it('should rethrow when a migration fails, keep applied ones recorded and release the lock', async () => {
    const error = new Error('boom');
    const { migrator, service } = setup({
      migrations: [
        { id: 'a', up: vi.fn().mockResolvedValue(undefined) },
        { id: 'b', up: vi.fn().mockRejectedValue(error) },
      ],
    });

    await expect(migrator.up()).rejects.toBe(error);

    expect(service.logMigration).toHaveBeenCalledTimes(1);
    expect(service.logger.error).toHaveBeenCalled();
    expect(service.releaseLock).toHaveBeenCalledTimes(1);
  });

  it('should reject on changelog mismatch', async () => {
    const { migrator, service } = setup({
      changelog: [{ identifier: 'x' }],
      migrations: [{ id: 'a', up: vi.fn() }],
    });

    await expect(migrator.up()).rejects.toThrow(/Migration mismatch/);

    expect(service.releaseLock).toHaveBeenCalledTimes(1);
  });
});

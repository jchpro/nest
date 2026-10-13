import { describe, expect, it, vi } from 'vitest';
import { MigrateService } from './migrate.service.js';

describe('MigrateService locking', () => {
  function create() {
    const calls: string[] = [];
    const lockModel = {
      createIndexes: vi.fn(async () => {
        calls.push('createIndexes');
      }),
      updateOne: vi.fn(async (filter: Record<string, unknown>, _update?: unknown, _options?: unknown) => {
        calls.push(`updateOne ${JSON.stringify(filter)}`);
        return { modifiedCount: 0, upsertedCount: 0 };
      }),
    };
    const service = new MigrateService({} as any, [], {} as any, lockModel as any);
    return { service, lockModel, calls };
  }

  const duplicateKeyError = () => Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });

  /** The call which tries to take the lock, as opposed to adopting a lock document of an earlier version. */
  const acquireCall = (lockModel: ReturnType<typeof create>['lockModel']) =>
    lockModel.updateOne.mock.calls.find(([filter]) => 'locked' in filter)!;

  it('makes sure the unique index exists before taking the lock', async () => {
    const { service, calls } = create();

    await service.acquireLock();

    expect(calls[0]).toBe('createIndexes');
  });

  it('takes the lock with an upsert on the key, only when it is not locked', async () => {
    const { service, lockModel } = create();

    await service.acquireLock();

    const [filter, update, options] = acquireCall(lockModel);
    expect(filter).toEqual({ key: 'migrations', locked: { $ne: true } });
    expect(update).toEqual({ $set: { locked: true, processId: process.pid, ownerId: expect.any(String) } });
    expect(options).toEqual({ upsert: true });
  });

  it.each([
    ['the lock document was unlocked and got locked', { modifiedCount: 1, upsertedCount: 0 }],
    ['the lock document was created', { modifiedCount: 0, upsertedCount: 1 }],
  ])('acquires the lock when %s', async (_name, result) => {
    const { service, lockModel } = create();
    lockModel.updateOne.mockImplementation(async (filter: Record<string, unknown>) =>
      'locked' in filter ? result : { modifiedCount: 0, upsertedCount: 0 },
    );

    await expect(service.acquireLock()).resolves.toBe(true);
  });

  it('doesn\'t acquire the lock when the update changed nothing', async () => {
    const { service } = create();

    await expect(service.acquireLock()).resolves.toBe(false);
  });

  it('doesn\'t acquire the lock when creating the lock document fails with a duplicate key, which means it is held', async () => {
    const { service, lockModel } = create();
    lockModel.updateOne.mockImplementation(async (filter: Record<string, unknown>) => {
      if ('locked' in filter) {
        throw duplicateKeyError();
      }
      return { modifiedCount: 0, upsertedCount: 0 };
    });

    await expect(service.acquireLock()).resolves.toBe(false);
  });

  it('passes on any other error', async () => {
    const { service, lockModel } = create();
    const failure = new Error('connection lost');
    lockModel.updateOne.mockRejectedValue(failure);

    await expect(service.acquireLock()).rejects.toBe(failure);
  });

  it('gives a key to the lock document of an earlier version, and ignores a duplicate key while doing so', async () => {
    const { service, lockModel } = create();
    lockModel.updateOne.mockImplementation(async (filter: Record<string, unknown>) => {
      if ('locked' in filter) {
        return { modifiedCount: 1, upsertedCount: 0 };
      }
      throw duplicateKeyError();
    });

    await expect(service.acquireLock()).resolves.toBe(true);
    expect(lockModel.updateOne).toHaveBeenCalledWith({ key: { $exists: false } }, { $set: { key: 'migrations' } });
  });

  it('releases only the lock it holds', async () => {
    const { service, lockModel } = create();
    lockModel.updateOne.mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 });
    await service.acquireLock();
    const [, update] = acquireCall(lockModel);
    const ownerId = (update as { $set: { ownerId: string } }).$set.ownerId;

    const released = await service.releaseLock();

    expect(released).toBe(true);
    expect(lockModel.updateOne).toHaveBeenLastCalledWith(
      { key: 'migrations', ownerId },
      { $set: { locked: false }, $unset: { processId: true, ownerId: true } },
    );
  });

  it('reports that nothing was released when the lock is held by someone else', async () => {
    const { service } = create();

    await expect(service.releaseLock()).resolves.toBe(false);
  });

  it('uses an owner of its own for each instance', async () => {
    const first = create();
    const second = create();

    await first.service.acquireLock();
    await second.service.acquireLock();

    const owner = (model: ReturnType<typeof create>['lockModel']) => (acquireCall(model)[1] as { $set: { ownerId: string } }).$set.ownerId;
    expect(owner(first.lockModel)).not.toBe(owner(second.lockModel));
  });
});

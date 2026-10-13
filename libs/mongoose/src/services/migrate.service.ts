import { MigrationWrapper } from "../types/migrations.js";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { CHANGELOG_LOCK_KEY, ChangelogLock, type ChangelogLockDocument } from "../schemas/changelog-lock.schema.js";
import { Changelog, type ChangelogDocument } from "../schemas/changelog.schema.js";

/**
 * Used internally by the migration mechanism, for use only in `main.ts`.
 */
@Injectable()
export class MigrateService {

  static readonly MIGRATIONS = 'MONGO_MIGRATIONS';

  readonly logger = new Logger(MigrateService.name);

  private readonly ownerId = randomUUID();

  constructor(
    @InjectConnection() readonly connection: Connection,
    @Inject(MigrateService.MIGRATIONS)
    readonly migrations: MigrationWrapper[],
    @InjectModel(Changelog.name)
    private readonly changelogModel: Model<ChangelogDocument>,
    @InjectModel(ChangelogLock.name)
    private readonly changelogLockModel: Model<ChangelogLockDocument>
  ) { }

  /**
   * Takes the lock, atomically: of any number of instances trying at the same time, only one gets it.
   * It is an upsert on the unique `key`, when the lock document exists and is held the upsert
   * can't match it and fails to insert another one with the same key.
   */
  public async acquireLock(): Promise<boolean> {
    // The unique index is what makes this safe, and `autoIndex` may be turned off
    await this.changelogLockModel.createIndexes();
    await this.adoptLegacyLock();
    try {
      const result = await this.changelogLockModel.updateOne(
        { key: CHANGELOG_LOCK_KEY, locked: { $ne: true } },
        { $set: this.lockData() },
        { upsert: true }
      );
      return result.modifiedCount === 1 || result.upsertedCount === 1;
    } catch (err) {
      if (MigrateService.isDuplicateKeyError(err)) {
        // The document exists and is locked by someone else
        return false;
      }
      throw err;
    }
  }

  /**
   * Releases the lock, but only if this instance holds it.
   */
  public async releaseLock(): Promise<boolean> {
    const result = await this.changelogLockModel.updateOne({ key: CHANGELOG_LOCK_KEY, ownerId: this.ownerId }, {
      $set: { locked: false },
      $unset: { processId: true, ownerId: true }
    });
    return result.modifiedCount === 1;
  }

  public async logMigration(migration: MigrationWrapper): Promise<void> {
    await this.changelogModel.create({
      identifier: migration.id,
      applied: new Date()
    });
  }

  public getChangelog(): Promise<ChangelogDocument[]> {
    return this.changelogModel.find({}, {}, {
      sort: { applied: 1 }
    }).exec();
  }

  /**
   * The lock document made by an earlier version has no `key`, it is given one. If an instance of that version
   * holds it (a rolling deploy), it stays locked and this instance waits like any other.
   */
  private async adoptLegacyLock(): Promise<void> {
    try {
      await this.changelogLockModel.updateOne({ key: { $exists: false } }, { $set: { key: CHANGELOG_LOCK_KEY } });
    } catch (err) {
      // Another instance has just created the lock document with the key, the legacy one is left alone
      if (!MigrateService.isDuplicateKeyError(err)) {
        throw err;
      }
    }
  }

  private lockData(): Partial<ChangelogLock> {
    return {
      locked: true,
      processId: process.pid,
      ownerId: this.ownerId
    };
  }

  private static isDuplicateKeyError(err: unknown): boolean {
    return (err as { code?: unknown } | null)?.code === 11000;
  }

}

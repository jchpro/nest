import { MigrationWrapper } from "../types/migrations";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { ChangelogLock, ChangelogLockDocument } from "../schemas/changelog-lock.schema";
import { Changelog, ChangelogDocument } from "../schemas/changelog.schema";

/**
 * Used internally by the migration mechanism, for use only in `main.ts`.
 */
@Injectable()
export class MigrateService {

  static readonly MIGRATIONS = 'MONGO_MIGRATIONS';

  readonly logger = new Logger(MigrateService.name);

  constructor(
    @InjectConnection() readonly connection: Connection,
    @Inject(MigrateService.MIGRATIONS)
    readonly migrations: MigrationWrapper[],
    @InjectModel(Changelog.name)
    private readonly changelogModel: Model<ChangelogDocument>,
    @InjectModel(ChangelogLock.name)
    private readonly changelogLockModel: Model<ChangelogLockDocument>
  ) { }

  public async acquireLock(): Promise<boolean> {
    const lock = await this.changelogLockModel.findOne().exec();
    if (!lock) {
      const result = await this.changelogLockModel.create(this.lockData())
      return !!result;
    }
    if (lock.locked) {
      return false;
    }
    const result = await this.changelogLockModel.updateOne({}, {
      $set: this.lockData()
    });
    return result.modifiedCount === 1;
  }

  public async releaseLock(): Promise<boolean> {
    const result = await this.changelogLockModel.updateOne({}, {
      $set: { locked: false },
      $unset: { processId: true }
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

  private lockData(): Partial<ChangelogLock> {
    return {
      locked: true,
      processId: process.pid
    };
  }

}

import { type INestApplication } from "@nestjs/common";
import { type Connection } from 'mongoose';

export type MigrationDb = NonNullable<Connection['db']>;
export type MigrationClient = ReturnType<Connection['getClient']>;

/**
 * Mongo DB migration file.
 */
export interface Migration {
  up(db: MigrationDb, client: MigrationClient, app: INestApplication): Promise<void>;
  // No support yet
  // down(db: Db, client: MongoClient, app: INestApplication): Promise<void>;
}

/**
 * Wraps migration with `id`.
 */
export class MigrationWrapper {

  constructor(
    readonly id: string,
    readonly migrate: Migration
  ) { }

}

export interface MigrateOptions {

  /**
   * Name of the main changelog collection, `changelog` by default.
   */
  readonly collectionName?: string;

  /**
   * Name of the main changelog lock collection, `changelog-lock` by default.
   */
  readonly lockCollectionName?: string;
}

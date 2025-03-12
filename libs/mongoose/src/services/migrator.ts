import { INestApplication, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { MigrateService } from './migrate.service';
import { MigrationWrapper } from '../types/migrations';

export class Migrator {

  private readonly service: MigrateService;
  private readonly connection: Connection;
  private readonly logger: Logger;
  private readonly migrations: MigrationWrapper[];

  constructor(
    private readonly app: INestApplication
  ) {
    this.service = this.app.get(MigrateService);
    this.connection = this.service.connection;
    this.logger = this.service.logger;
    this.migrations = this.service.migrations;
  }

  async up() {
    const { service, logger, connection, migrations } = this;
    const acquired = await service.acquireLock();
    if (!acquired) {
      logger.log('Lock not acquired, skipping migration.');
      return;
    }
    logger.log('Successfully acquired changelog lock.');
    try {
      const { db } = connection;
      const client = connection.getClient();
      logger.log('Running migrations...');
      const logMigrations = await service.getChangelog();
      let runBefore = 0;
      let runNow = 0;
      for (const migration of migrations) {
        const index = migrations.indexOf(migration);
        const logMigration = logMigrations[index];
        if (logMigration) {
          if (logMigration.identifier === migration.id) {
            runBefore++;
            continue;
          } else {
            throw new Error(`Migration mismatch: (file) ${migration.id} != (changelog) ${logMigration.identifier}`);
          }
        }
        if (!db) {
          throw new Error(`Database not available, MongoDB connection not opened`);
        }
        await migration.migrate.up(db, client, this.app);
        await service.logMigration(migration);
        runNow++;
      }
      logger.log(`Migrations run before: ${runBefore}`);
      logger.log(`Migrations run now: ${runNow}`);
    } catch (err) {
      logger.error(`Failed to run all migrations`, err);
    } finally {
      const released = await service.releaseLock();
      if (released) {
        logger.log('Successfully released changelog lock.');
      } else {
        logger.warn('Failed to release changelog lock!');
      }
    }
  }

}

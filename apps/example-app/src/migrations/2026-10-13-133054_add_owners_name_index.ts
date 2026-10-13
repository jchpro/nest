import type { Migration, MigrationClient, MigrationDb } from '@jchpro/nest-mongoose';
import type { INestApplication } from "@nestjs/common";

// Add owners name index

const migration: Migration = {
  async up(db: MigrationDb, connection: MigrationClient, app: INestApplication) {
    // Owners are listed sorted by name
    await db.collection('owners').createIndex({ name: 1 });
  },
};
export default migration;
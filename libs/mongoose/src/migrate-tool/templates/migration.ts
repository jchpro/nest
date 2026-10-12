import { EOL } from "os";

export function migrationTemplate(libName: string, name: string) {
  return [
    `import type { Migration, MigrationClient, MigrationDb } from '${libName}';`,
    `import type { INestApplication } from "@nestjs/common";`,
    '',
    `// ${name}`,
    '',
    'const migration: Migration = {',
    '  async up(db: MigrationDb, connection: MigrationClient, app: INestApplication) {',
    '    // TODO Implement',
    '  },',
    '};',
    'export default migration;'
  ].join(EOL);
}

// No support for `down` migration yet.
// '  async down(db: Db, connection: MongoClient, app: INestApplication) {',
// '  }',

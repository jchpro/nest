import { EOL } from "os";

export function migrationTemplate(libName: string, name: string) {
  return [
    `import { Migration } from '${libName}';`,
    `import { INestApplication } from "@nestjs/common";`,
    'import { Db, MongoClient } from \'mongodb\';',
    '',
    `// ${name}`,
    '',
    'const migration: Migration = {',
    '  async up(db: Db, connection: MongoClient, app: INestApplication) {',
    '    // TODO Implement',
    '  },',
    '};',
    'export default migration;'
  ].join(EOL);
}

// No support for `down` migration yet.
// '  async down(db: Db, connection: MongoClient, app: INestApplication) {',
// '  }',

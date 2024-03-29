import { EOL } from "os";
import { MigrationFile } from "../types/migration-file";

export function collectorTemplate(libName: string, migrations: MigrationFile[] = []): string {
  return [
    '/* tslint:disable */',
    '/* eslint-disable */',
    '',
    `// This file was autogenerated, don't edit manually.`,
    '',
    `import { MigrationWrapper } from '${libName}';`,
    ...migrations.map(i => `import ${i.token} from '${i.importPath}';`),
    '',
    'export default [',
      ...migrations.map(i => `  new MigrationWrapper('${i.id}', ${i.token}),`),
    '];',
    ''
  ].join(EOL);
}

import { snakeCase } from "case-anything";
import { exists, readDirFiles, readlineQuestion } from '@jchpro/nest-common';
import { collectorTemplate } from "./templates/collector.js";
import { migrationTemplate } from "./templates/migration.js";
import { type MigrationFile } from "./types/migration-file.js";
import { getTimestamp } from "./utilities/datetime.js";
import { isMigrationFile } from './utilities/migration-files.js';
import { dirname, basename, sep, posix, relative, resolve } from 'path';
import { writeFile } from 'fs/promises';

export async function generate() {

  // Read process arguments
  const reversedArgs = process.argv.slice(0).reverse();
  const [libNameArg, collectorArg, migrationsDirArg] = reversedArgs;

  // Validation
  const cwd = process.cwd();
  if (typeof migrationsDirArg !== 'string') {
    throw new Error(`Migrations directory argument (1st) is required`);
  }
  const migrationsDir = resolve(cwd, migrationsDirArg);
  if (!await exists(migrationsDir, 'dir')) {
    throw new Error(`Migrations directory defined by "${migrationsDirArg}" argument (1st) not found: ${migrationsDir}`);
  }
  if (typeof migrationsDirArg !== 'string') {
    throw new Error(`Collector file argument (2nd) is required`);
  }
  const collectorPath = resolve(cwd, collectorArg);
  if (!await exists(collectorPath, 'file')) {
    throw new Error(`Collector file defined by "${collectorArg}" argument (2nd) not found: ${collectorPath}`);
  }
  if (!libNameArg) {
    throw new Error(`Missing required argument for Mongoose library name alias (3rd)`);
  }
  const libName = libNameArg.trim();

  // Input name
  const name = (await readlineQuestion('Enter name of the migration (in sentence-case):')).trim();

  // Generate migration file
  const paths = {
    collector: collectorPath,
    directory: migrationsDir,
  }
  const migrationContent = migrationTemplate(libName, name);
  const timestamp = getTimestamp();
  const migrationFilename = `${timestamp}_${snakeCase(name)}.ts`;
  const migrationPath = resolve(paths.directory, migrationFilename);
  await writeFile(migrationPath, migrationContent)
  console.log(`Migration created: ${migrationPath}`);

  // Regenerate collector file
  const collectorDir = dirname(paths.collector);
  const migrations: MigrationFile[] = (await readDirFiles(paths.directory, '.ts'))
    .filter(filePath => isMigrationFile(basename(filePath)))
    .map(filePath => {
      const fileNoExt = basename(filePath)
                                   .replace(/\.ts$/, '')
      const datePart = (/([\d-]+)_/.exec(fileNoExt)![1]);
      const namePart = fileNoExt.replace(datePart + '_', '');
      const relativePath = relative(collectorDir, resolve(paths.directory, fileNoExt))
                                      .split(sep)
                                      .join(posix.sep);
      const ts = datePart.replaceAll('-', '_');
      return {
        id: `${ts}_${namePart}`,
        token: `migration_${ts}`,
        // ESM (`nodenext`) needs the extension; TypeScript resolves `.js` to the `.ts` file
        importPath: `./${relativePath}.js`
      };
    })
  const collectorContent = collectorTemplate(libName, migrations);
  await (writeFile(paths.collector, collectorContent));
  console.log(`Collector file updated`);
}

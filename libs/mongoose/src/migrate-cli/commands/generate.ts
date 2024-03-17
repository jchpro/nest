import { NestProject, Project, readDirFiles } from '@jchpro/nest-librarian';
import { snakeCase } from "case-anything";
import { LIB_NAME } from "../config";
import { collectorTemplate } from "../templates/collector";
import { migrationTemplate } from "../templates/migration";
import { MigrateConfig, MigrateProject } from '../types/migrate-config';
import { MigrationFile } from "../types/migration-file";
import { getTimestamp } from "../utilities/datetime";
import { dirname, basename, sep, posix, relative, resolve } from 'path';
import { writeFile } from 'fs/promises';
import { resolveMigrateDirs } from '../utilities/directories';

export async function generate(name: string, options: {
  readonly project: string;
}) {

  // Get Nest project workspace
  const workspace = await Project.locate(libName => libName === name);
  const nest = workspace.config;
  const migrate = (await workspace.getPackageJson() as {
    mongoMigrate?: MigrateConfig }
  ).mongoMigrate;

  // Check migrate config
  if (!migrate) {
    console.error(`Migrate configuration is not set up, please run 'setup' command first.`);
    process.exit(1);
  }

  // Get project config
  let projectName: string | undefined;
  let project: MigrateProject;
  let nestProject: NestProject | undefined;
  if (nest.projects) {

    // Monorepo
    if (!migrate.projects) {
      console.error(`There aren't any projects configured, please run 'setup' command first`);
      process.exit(1);
    }
    const useDefault = !options.project;
    if (useDefault && !migrate.default) {
      console.error(`Default project isn't defined in the configuration and project was not provided`);
      process.exit(1);
    }
    projectName = useDefault ? migrate.default! : options.project;
    project = migrate.projects[projectName];
    nestProject = nest.projects[projectName];
  } else {

    // Non-monorepo
    if (!migrate.root) {
      console.error(`Project in non-monorepo workspace isn't configured, please run 'setup' command first`);
      process.exit(1);
    }
    project = migrate.root;
  }

  // Generate migration file
  const paths = resolveMigrateDirs(workspace.rootDir, project, nestProject);
  const migrationContent = migrationTemplate(LIB_NAME, name);
  const timestamp = getTimestamp();
  const migrationFilename = `${timestamp}_${snakeCase(name)}.ts`;
  const migrationPath = resolve(paths.directory, migrationFilename);
  await writeFile(migrationPath, migrationContent)
  console.log(`Migration created: ${migrationPath}`);

  // Regenerate collector file
  const collectorDir = dirname(paths.collector);
  const migrations: MigrationFile[] = (await readDirFiles(paths.directory, '.ts'))
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
        importPath: `./${relativePath}`
      };
    })
  const collectorContent = collectorTemplate(LIB_NAME, migrations);
  await (writeFile(paths.collector, collectorContent));
  console.log(`Collector file updated`);
}

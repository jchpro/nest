import { createPaths, exists, Project, writeJsonObject } from '@jchpro/nest-librarian';
import * as path from 'path';
import { LIB_NAME } from "../config";
import { collectorTemplate } from "../templates/collector";
import { MigrateConfig, MigrateProject } from "../types/migrate-config";
import { writeFile } from 'fs/promises';

export async function setup(projectName: string, options: {
  readonly default: boolean;
  readonly collector: string;
  readonly directory: string;
}) {

  // Get Nest project workspace
  const workspace = await Project.locate();
  const nest = workspace.config;
  const pkg = await workspace.getPackageJson() as { mongoMigrate?: MigrateConfig };

  // Check project
  if (!(projectName in nest.projects)) {
    console.error(`Project "${projectName}" not found in Nest.js CLI config`);
    process.exit(1);
  }
  const nestProject = nest.projects[projectName];
  if (nestProject.type !== 'application') {
    console.error(`Project "${projectName}" must be an application!`);
    process.exit(1);
  }

  // Read config
  const config: MigrateConfig = pkg.mongoMigrate ?? { projects: {} };

  // Add project
  const { collector, directory } = options;
  const project: MigrateProject = {
    collector,
    directory
  };
  config.projects[projectName] = project;
  if (options.default) {
    config.default = projectName;
  }
  pkg.mongoMigrate = config;
  await writeJsonObject(workspace.packageJsonPath, pkg);
  console.log(`Added project "${projectName}" to the migrations config.`);

  // Create directory
  const projectSrcDir = path.resolve(workspace.rootDir, nestProject.sourceRoot);
  const migrationsDir = path.resolve(projectSrcDir, project.directory);
  await createPaths([migrationsDir]);
  console.log(`Created directory: ${migrationsDir}`);

  // Create collector file
  const collectorPath = path.resolve(projectSrcDir, project.collector);
  if (await exists(collectorPath)) {
    console.log('Skipping creation of collector file, already exists.');
    return;
  }
  await writeFile(collectorPath, collectorTemplate(LIB_NAME), 'utf-8');
  console.log(`Created collector file: ${collectorPath}`);
}

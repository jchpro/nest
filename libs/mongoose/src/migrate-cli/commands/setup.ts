import { createPaths, exists, NestProject, Project, writeJsonObject } from '@jchpro/nest-librarian';
import * as path from 'path';
import { LIB_NAME } from "../config";
import { collectorTemplate } from "../templates/collector";
import { MigrateConfig, MigrateProject } from "../types/migrate-config";
import { writeFile } from 'fs/promises';

export async function setup(options: {
  readonly project?: string;
  readonly default: boolean;
  readonly collector: string;
  readonly directory: string;
}) {

  // Get Nest project workspace
  const workspace = await Project.locate();
  const nest = workspace.config;
  const pkg = await workspace.getPackageJson() as { mongoMigrate?: MigrateConfig };

  // Check project
  let projectName: string | undefined;
  let nestProject: NestProject | undefined;
  if (nest.projects) {

    // Monorepo
    if (!options.project) {
      console.error(`You must provide --project option in monorepo workspace.`);
      process.exit(1);
    }
    if (!(options.project in nest.projects)) {
      console.error(`Project "${projectName}" not found in Nest.js CLI config`);
      process.exit(1);
    }
    nestProject = nest.projects[options.project];
    if (nestProject.type !== 'application') {
      console.error(`Project "${projectName}" must be an application!`);
      process.exit(1);
    }
    projectName = options.project;
  }

  // Read config
  const config: MigrateConfig = pkg.mongoMigrate ?? { };

  // Add project
  const { collector, directory } = options;
  const project: MigrateProject = {
    collector,
    directory
  };
  if (projectName) {
    if (!config.projects) {
      config.projects = {};
    }
    config.projects[projectName] = project;
    if (options.default) {
      config.default = projectName;
    }
  } else {
    config.root = project;
  }
  pkg.mongoMigrate = config;
  await writeJsonObject(workspace.packageJsonPath, pkg);
  console.log(
    projectName ? `Added project "${projectName}" to the migrations config.`
      : 'Added root project to the migrations config.'
  );

  // Create directory
  const projectSrcDir = path.resolve(workspace.rootDir, nestProject?.sourceRoot ?? 'src');
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

import { NestProject } from '@jchpro/nest-librarian';
import { resolve } from 'path';
import { MigrateProject } from '../types/migrate-config';

export function resolveMigrateDirs(rootDir: string, nestProject: NestProject, project: MigrateProject): MigrateProject {
  return {
    collector: resolve(rootDir, nestProject.sourceRoot, project.collector),
    directory: resolve(rootDir, nestProject.sourceRoot, project.directory)
  };
}

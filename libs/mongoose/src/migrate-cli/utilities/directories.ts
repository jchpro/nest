import { NestProject } from '@jchpro/nest-librarian';
import { resolve } from 'path';
import { MigrateProject } from '../types/migrate-config';

export function resolveMigrateDirs(rootDir: string,
                                   project: MigrateProject,
                                   nestProject?: NestProject): MigrateProject {
  return {
    collector: resolve(rootDir, nestProject?.sourceRoot ?? 'src', project.collector),
    directory: resolve(rootDir, nestProject?.sourceRoot ?? 'src', project.directory)
  };
}

import * as finder from 'find-package-json';
import { dirname, join } from 'path';
import { PackageJson } from 'types-package-json';
import { NEST_FILE } from '../consts';
import { NestConfig, NestLibrary } from '../types/nest-config';
import { exists, readJsonObject } from '../utilities/filesystem';
import { Library } from './library';

export class Project {

  private constructor(
    readonly rootDir: string,
    readonly configPath: string,
    readonly packageJsonPath: string,
    readonly config: NestConfig,
    readonly libraries: readonly Library[]
  ) { }

  async getPackageJson(): Promise<PackageJson> {
    return readJsonObject<PackageJson>(this.packageJsonPath);
  }

  static async locate(): Promise<Project> {
    let found: {
      readonly rootDir: string;
      readonly nestPath: string;
      readonly packagePath: string;
    } | undefined;

    for (const pkg of Project.findPackageJsons()) {
      const rootDir = dirname(pkg.filename);
      const nestFilePath = join(rootDir, NEST_FILE);
      if (await exists(nestFilePath, 'file')) {
        found = {
          rootDir,
          nestPath: nestFilePath,
          packagePath: pkg.filename
        };
        break;
      }
    }

    if (!found) {
      throw new Error(`Could not locate ${NEST_FILE}`);
    }

    const nestConfig = await readJsonObject<NestConfig>(found.nestPath);
    return new Project(
      found.rootDir,
      found.nestPath,
      found.packagePath,
      nestConfig,
      await Project.getLibraries(nestConfig, found.rootDir)
    );
  }

  private static findPackageJsons(): finder.FoundPackage[] {
    const iterator = finder();
    const packages: finder.FoundPackage[] = [];
    let result: finder.FindResult = iterator.next();
    while (!result.done) {
      packages.push(result);
      result = iterator.next();
    }
    return packages;
  }

  private static async getLibraries(config: NestConfig, rootDir: string): Promise<Library[]> {
    const libEntries = Object.entries(config.projects)
      .filter(([, project]) => project.type === 'library');
    const libraries: Library[] = [];
    for (const [name, project] of libEntries) {
      libraries.push(await Library.init(name, project as NestLibrary, rootDir));
    }
    return libraries;
  }

}

import { PackageJson } from 'types-package-json';
import { PACKAGE_LIB_FILE } from '../consts';
import { NestLibrary } from '../types/nest-config';
import { join } from 'path';
import { TsConfig } from '../types/ts-config';
import { exists, readJsonObject } from '../utilities/filesystem';

export class Library {

  private constructor(
    readonly name: string,
    readonly config: NestLibrary,
    readonly tsConfig: TsConfig,
    private readonly root: string
  ) { }

  get rootDir(): string {
    return join(this.root, this.config.root);
  }

  get sourceRootDir(): string {
    return join(this.root, this.config.sourceRoot);
  }

  get tsConfigPath(): string {
    return Library.getTsConfigPath(this.rootDir, this.config.compilerOptions.tsConfigPath);
  }

  get tsOutDir(): string {
    return join(this.rootDir, this.tsConfig.compilerOptions.outDir);
  }

  get distEntryFile(): string {
    return join(this.tsOutDir, `${this.config.entryFile}.js`);
  }

  async getLibrarianFile(): Promise<PackageJson | undefined> {
    const path = join(this.rootDir, PACKAGE_LIB_FILE);
    if (await exists(path, 'file')) {
      return readJsonObject<PackageJson>(path);
    }
    return;
  }

  static async init(name: string, config: NestLibrary, rootDir: string): Promise<Library> {
    return new Library(
      name,
      config,
      await readJsonObject<TsConfig>(Library.getTsConfigPath(rootDir, config.compilerOptions.tsConfigPath)),
      rootDir
    );
  }

  private static getTsConfigPath(rootDir: string, relativePath: string): string {
    return join(rootDir, relativePath)
  }

}

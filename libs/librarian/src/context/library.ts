import { PackageJson } from 'types-package-json';
import { PACKAGE_LIB_FILE } from '../consts';
import { NestLibrary } from '../types/nest-config';
import { join } from 'path';
import { TsConfig } from '../types/ts-config';
import { exists, readJsonObject } from '../utilities/filesystem';

/**
 * Represents library defined in the nest-cli.json file.
 * Resolves absolute paths to the significant file paths and contains loaded TypeScript config excerpt.
 */
export class Library {

  private constructor(
    readonly name: string,
    readonly config: NestLibrary,
    readonly tsConfig: TsConfig,
    private readonly workspaceRoot: string
  ) { }

  get rootDir(): string {
    return join(this.workspaceRoot, this.config.root);
  }

  get sourceRootDir(): string {
    return join(this.workspaceRoot, this.config.sourceRoot);
  }

  get tsConfigPath(): string {
    return Library.getTsConfigPath(this.workspaceRoot, this.config.compilerOptions.tsConfigPath);
  }

  get tsOutDir(): string {
    return join(this.rootDir, this.tsConfig.compilerOptions.outDir);
  }

  get distEntryFile(): string {
    return join(this.tsOutDir, `${this.config.entryFile}.js`);
  }

  /**
   * Returns `package.lib.json` file contents if the file exists.
   */
  async getLibrarianFile(): Promise<PackageJson | undefined> {
    const path = join(this.rootDir, PACKAGE_LIB_FILE);
    if (await exists(path, 'file')) {
      return readJsonObject<PackageJson>(path);
    }
    return;
  }

  /**
   * Initializes the Library reading the tsconfig file of the library.
   */
  static async init(name: string, config: NestLibrary, workspaceRootDir: string): Promise<Library> {
    return new Library(
      name,
      config,
      await readJsonObject<TsConfig>(Library.getTsConfigPath(workspaceRootDir, config.compilerOptions.tsConfigPath)),
      workspaceRootDir
    );
  }

  private static getTsConfigPath(rootDir: string, relativePath: string): string {
    return join(rootDir, relativePath)
  }

}

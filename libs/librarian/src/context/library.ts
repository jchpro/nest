import { spawn } from 'child_process';
import { PackageJson } from 'types-package-json';
import { TSConfigJSON } from 'types-tsconfig';
import { PACKAGE_LIB_FILE } from '../consts';
import { NestLibrary } from '../types/nest-config';
import { join } from 'path';
import { exists, readJsonObject } from '../utilities/filesystem';
import { prepareCommand } from '../utilities/spawning';

/**
 * Represents library defined in the nest-cli.json file.
 * Resolves absolute paths to the significant file paths and contains loaded TypeScript config excerpt.
 */
export class Library {

  private constructor(
    readonly name: string,
    readonly config: NestLibrary,
    readonly tsConfig: TSConfigJSON,
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
    return join(this.rootDir, this.tsConfig.compilerOptions!.outDir!);
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
   * Initializes the Library resolving effective TypeScript config in the process.
   */
  static async init(name: string,
                    config: NestLibrary,
                    workspaceRootDir: string): Promise<Library> {
    const tsConfig = await Library.resolveEffectiveTsConfig(Library.getTsConfigPath(workspaceRootDir, config.compilerOptions.tsConfigPath));
    return new Library(
      name,
      config,
      tsConfig,
      workspaceRootDir
    );
  }

  private static getTsConfigPath(rootDir: string, relativePath: string): string {
    return join(rootDir, relativePath)
  }

  private static async resolveEffectiveTsConfig(tsConfigPath: string): Promise<TSConfigJSON> {
    return new Promise<TSConfigJSON>((resolve, reject) => {
      const buildProcess = spawn(prepareCommand('npx'), [
        'tsc',
        '--project',
        tsConfigPath,
        '--showConfig'
      ]);
      let output: string = '';
      buildProcess.stdout.on('data', (chunk: string | Buffer) => {
        output += chunk.toString();
      });
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(output));
          return;
        }
        reject(`TypeScript compiler process exited with code ${code}`);
      })
    });
  }

}

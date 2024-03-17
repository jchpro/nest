export interface NestConfig {
  readonly monorepo?: boolean;
  readonly projects?: Record<string, NestProject>;
}

export interface NestProject {
  readonly type: 'application' | 'library';
  readonly root: string;
  readonly entryFile: string;
  readonly sourceRoot: string;
  readonly compilerOptions: NestProjectCompilerOptions;
}

export interface NestLibrary extends NestProject {
  readonly type: 'library';
}

export interface NestProjectCompilerOptions {
  readonly tsConfigPath: string;
}

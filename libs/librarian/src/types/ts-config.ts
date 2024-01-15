export interface TsConfig {
  readonly extends?: string;
  readonly compilerOptions: TsConfigCompilerOptions;
}

export interface TsConfigCompilerOptions {
  readonly outDir: string;
}

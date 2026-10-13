import { ConfigModule, ConfigResolver, EnvPropertiesValidationError, EnvProperty } from '@jchpro/nest-config';
import { Controller, Get } from '@nestjs/common';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './helpers/app.js';

enum Mode {
  Fast = 'fast',
  Safe = 'safe',
}

class ServerConfig {
  @EnvProperty('E2E_CFG_PORT')
  @IsInt()
  @Min(1)
  readonly port!: number;

  @EnvProperty('E2E_CFG_NAME')
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @EnvProperty('E2E_CFG_MODE')
  @IsEnum(Mode)
  readonly mode!: Mode;

  @EnvProperty('E2E_CFG_COMMENT')
  @IsOptional()
  @IsString()
  readonly comment?: string;
}

class DatabaseConfig {
  @EnvProperty('E2E_CFG_DB_URI')
  @IsString()
  @IsNotEmpty()
  readonly uri!: string;
}

@Controller('config')
class ConfigController {
  constructor(private readonly server: ServerConfig) {}

  @Get()
  get() {
    return { port: this.server.port, portType: typeof this.server.port, name: this.server.name, mode: this.server.mode };
  }
}

const KEYS = ['E2E_CFG_PORT', 'E2E_CFG_NAME', 'E2E_CFG_MODE', 'E2E_CFG_COMMENT', 'E2E_CFG_DB_URI'];

describe('ConfigModule', () => {
  let tempDir: string;

  beforeEach(() => {
    KEYS.forEach((key) => delete process.env[key]);
    tempDir = mkdtempSync(join(tmpdir(), 'config-e2e-'));
  });

  afterEach(() => {
    KEYS.forEach((key) => delete process.env[key]);
    rmSync(tempDir, { recursive: true, force: true });
  });

  function setEnv(values: Record<string, string>) {
    Object.assign(process.env, values);
  }

  const validEnv = { E2E_CFG_PORT: '8080', E2E_CFG_NAME: 'e2e', E2E_CFG_MODE: 'safe', E2E_CFG_DB_URI: 'mongodb://localhost/e2e' };

  // `ConfigModule.forRoot` reads and validates the environment as soon as it is called
  const configModule = (options: Partial<Parameters<typeof ConfigModule.forRoot>[0]> = {}) =>
    ConfigModule.forRoot({ load: [ServerConfig, DatabaseConfig], nestConfigOptions: { ignoreEnvFile: true }, ...options });

  it('maps the environment variables to the config classes, converting the types', async () => {
    setEnv(validEnv);

    const { app, http } = await createApp({ imports: [configModule()], controllers: [ConfigController] });
    const res = await http.get('/config');

    expect(res.body).toEqual({ port: 8080, portType: 'number', name: 'e2e', mode: 'safe' });
    expect(app.get(DatabaseConfig).uri).toBe('mongodb://localhost/e2e');
    expect(app.get(ServerConfig)).toBeInstanceOf(ServerConfig);
    await app.close();
  });

  it('leaves an optional variable undefined when it is missing, and reads it when it is set', async () => {
    setEnv(validEnv);
    const without = await createApp({ imports: [configModule()] });
    const withoutValue = without.app.get(ServerConfig).comment;
    await without.app.close();

    setEnv({ E2E_CFG_COMMENT: 'hello' });
    const withComment = await createApp({ imports: [configModule()] });
    const withValue = withComment.app.get(ServerConfig).comment;
    await withComment.app.close();

    expect(withoutValue).toBeUndefined();
    expect(withValue).toBe('hello');
  });

  it('makes the classes available through the resolver right after the module is declared', () => {
    setEnv(validEnv);

    configModule();

    expect(ConfigResolver.get(ServerConfig)).toMatchObject({ port: 8080, name: 'e2e', mode: 'safe' });
    expect(ConfigResolver.get(DatabaseConfig)).toMatchObject({ uri: 'mongodb://localhost/e2e' });
  });

  it('reads the variables from an env file', async () => {
    const envFile = join(tempDir, '.env');
    writeFileSync(envFile, Object.entries(validEnv).map(([key, value]) => `${key}=${value}`).join('\n'));

    const { app } = await createApp({
      imports: [configModule({ nestConfigOptions: { envFilePath: envFile } })],
    });

    expect(app.get(ServerConfig)).toMatchObject({ port: 8080, name: 'e2e' });
    await app.close();
  });

  // `@nestjs/config` validates inside an async `forRoot`, so a failure rejects the module import and Nest fails the boot with it
  it('fails the boot with EnvPropertiesValidationError naming every missing or invalid variable', async () => {
    setEnv({ E2E_CFG_PORT: 'not-a-number', E2E_CFG_MODE: 'turbo' });

    const error = await createApp({ imports: [configModule()] }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EnvPropertiesValidationError);
    const message = (error as Error).message;
    expect(message).toContain('E2E_CFG_PORT');
    expect(message).toContain('E2E_CFG_NAME');
    expect(message).toContain('E2E_CFG_MODE');
    // Also from the second config class
    expect(message).toContain('E2E_CFG_DB_URI');
    expect(message).not.toContain('E2E_CFG_COMMENT');
  });

  it('fails the boot of an app whose config is invalid', async () => {
    setEnv({ ...validEnv, E2E_CFG_PORT: '0' });

    const boot = () => createApp({ imports: [configModule()] });

    await expect(boot()).rejects.toThrow(EnvPropertiesValidationError);
  });

  it('fails the boot with what the error factory makes, passing it the errors and the variable names', async () => {
    setEnv({ ...validEnv, E2E_CFG_NAME: '' });
    class StartupError extends Error {
      constructor(readonly variables: string[]) {
        super(`Bad configuration: ${variables.join(', ')}`);
      }
    }

    const error = await createApp({
      imports: [
        configModule({
          errorFactory: (errors, variableNames) => new StartupError(errors.map((item) => variableNames.get(item) ?? item.property)),
        }),
      ],
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(StartupError);
    expect((error as StartupError).variables).toEqual(['E2E_CFG_NAME']);
    expect((error as Error).message).toBe('Bad configuration: E2E_CFG_NAME');
  });
});

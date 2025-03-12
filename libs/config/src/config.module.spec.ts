import { DynamicModule, FactoryProvider } from '@nestjs/common';
import { IsString } from 'class-validator';
import { ConfigModule } from './config.module';
import { ConfigResolver } from './consts/config.resolver';
import { EnvProperty } from './decorators/env.property';
import { EnvPropertiesValidationError } from './errors/env-properties-validation.error';

let PROCESS_ENV: any = {};

class NestConfigModuleMock {}

jest.mock('@nestjs/config', () => {
  return {
    ConfigModule: {
      forRoot: (options: {
        validate: (config: Record<string, unknown>) => any;
      }): DynamicModule => {
        options.validate(PROCESS_ENV);
        return {
          module: NestConfigModuleMock,
        };
      },
    },
  };
});

describe('ConfigModule', () => {

  class MyConfig {
    @EnvProperty()
    @IsString()
    NODE_ENV: string;
  }

  beforeEach(() => {
    PROCESS_ENV = {};
  });

  it('should return global `DynamicModule` with `MyConfig` provided when environment variables contain required field', () => {
    // Given
    PROCESS_ENV = {
      NODE_ENV: 'development',
    };

    // When
    const dynamicModule = ConfigModule.forRoot({
      load: [ MyConfig],
    });

    // Then
    expect(dynamicModule).toBeTruthy();
    expect(dynamicModule.module).toBe(ConfigModule);
    expect(dynamicModule.global).toBe(true);

    // And
    expect(dynamicModule.providers).toBeTruthy();
    const [provider] = dynamicModule.providers!;
    expect((provider as FactoryProvider).provide).toBe(MyConfig);
    expect((provider as FactoryProvider).useFactory).toBeTruthy();
  });

  it('should resolve config class with resolver after module initialization', () => {
    // Given
    PROCESS_ENV = {
      NODE_ENV: 'development',
    };

    // When
    ConfigModule.forRoot({
      load: [ MyConfig],
    });
    const config = ConfigResolver.get(MyConfig);

    // Then
    expect(config).toBeInstanceOf(MyConfig);
  });

  it("should fail `DynamicModule` creation when environment variables doesn't contain required field and throw default error", () => {
    // Given default PROCESS_ENV
    const testRunner = () => {
      ConfigModule.forRoot({
        load: [ MyConfig],
      });
    };

    // Expect
    expect(testRunner).toThrow(EnvPropertiesValidationError);
  });

  it("should fail `DynamicModule` creation when environment variables doesn't contain required field and throw custom error", () => {
    // Given default PROCESS_ENV
    class CustomError extends Error {
      constructor(errors: any[]) {
        super(`got ${errors.length} errors`);
      }
    }

    const testRunner = () => {
      ConfigModule.forRoot({
        load: [ MyConfig],
        errorFactory: (errors) => new CustomError(errors),
      });
    };

    // Expect
    expect(testRunner).toThrow(CustomError);
  });
});

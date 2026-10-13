import { type DynamicModule, type FactoryProvider } from '@nestjs/common';
import { IsString } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigModule } from './config.module.js';
import { ConfigResolver } from './consts/config.resolver.js';
import { EnvProperty } from './decorators/env.property.js';
import { EnvPropertiesValidationError } from './errors/env-properties-validation.error.js';

const state = vi.hoisted(() => ({
  processEnv: {} as Record<string, unknown>,
}));

class NestConfigModuleMock {}

vi.mock('@nestjs/config', () => {
  return {
    ConfigModule: {
      forRoot: (options: {
        validate: (config: Record<string, unknown>) => any;
      }): DynamicModule => {
        options.validate(state.processEnv);
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
    NODE_ENV!: string;
  }

  beforeEach(() => {
    state.processEnv = {};
  });

  it('should return global `DynamicModule` with `MyConfig` provided when environment variables contain required field', () => {
    // Given
    state.processEnv = {
      NODE_ENV: 'development',
    };

    // When
    const dynamicModule = ConfigModule.forRoot({
      load: [MyConfig],
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
    state.processEnv = {
      NODE_ENV: 'development',
    };

    // When
    ConfigModule.forRoot({
      load: [MyConfig],
    });
    const config = ConfigResolver.get(MyConfig);

    // Then
    expect(config).toBeInstanceOf(MyConfig);
  });

  it("should fail `DynamicModule` creation when environment variables doesn't contain required field and throw default error", () => {
    // Given default (empty) processEnv
    const testRunner = () => {
      ConfigModule.forRoot({
        load: [MyConfig],
      });
    };

    // Expect
    expect(testRunner).toThrow(EnvPropertiesValidationError);
  });

  it("should fail `DynamicModule` creation when environment variables doesn't contain required field and throw custom error", () => {
    // Given default (empty) processEnv
    class CustomError extends Error {
      constructor(errors: any[]) {
        super(`got ${errors.length} errors`);
      }
    }

    const testRunner = () => {
      ConfigModule.forRoot({
        load: [MyConfig],
        errorFactory: (errors) => new CustomError(errors),
      });
    };

    // Expect
    expect(testRunner).toThrow(CustomError);
  });

  it('should name the environment variable in the default error message', () => {
    // Given
    class RenamedConfig {
      @EnvProperty('MY_FIELD')
      @IsString()
      myField!: string;
    }

    // When
    const testRunner = () => {
      ConfigModule.forRoot({
        load: [RenamedConfig],
      });
    };

    // Then
    expect(testRunner).toThrow(/MY_FIELD \(property myField\)/);
  });

  it('should pass variable names of the failed properties to `errorFactory`', () => {
    // Given
    class RenamedConfig {
      @EnvProperty('MY_FIELD')
      @IsString()
      myField!: string;
    }
    let received: ReadonlyMap<unknown, string> | undefined;

    // When
    try {
      ConfigModule.forRoot({
        load: [RenamedConfig],
        errorFactory: (errors, variableNames) => {
          received = variableNames;
          return new Error(String(errors.length));
        },
      });
    } catch {
      // expected
    }

    // Then
    expect([...(received?.values() ?? [])]).toEqual(['MY_FIELD']);
  });
});

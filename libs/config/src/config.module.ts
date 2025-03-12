import { DynamicModule, FactoryProvider, Module, Type } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { storeResolvedConfig } from './consts/config.resolver';
import { METADATA_KEY } from './consts/metadata-key';
import { EnvPropertiesValidationError } from './errors/env-properties-validation.error';
import { ConfigModuleOptions } from './types/config-module-options';
import { EnvPropertyMetadata } from './types/env-property.metadata';

/**
 * Wrapper around Nest's `ConfigModule#forRoot` implementing config class validation and instantiation logic.
 * Refer to config.md for full usage documentation.
 */
@Module({})
export class ConfigModule {

  public static forRoot(options: ConfigModuleOptions): DynamicModule {
    const configItems = ConfigModule.getConfigProvidersAndValidators(options);
    const classes = configItems.map((item) => item.klass);
    const validators = configItems.map((item) => item.validator);
    const providers = configItems.map((item) => item.provider);
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          ...options.nestConfigOptions,
          validate: (config: Record<string, unknown>) => {
            const allErrors: ValidationError[] = [];
            validators.forEach((validator) => {
              const errors = validator(config);
              allErrors.push(...errors);
            });
            if (allErrors.length > 0) {
              if (typeof options.errorFactory === 'function') {
                throw options.errorFactory(allErrors);
              }
              throw new EnvPropertiesValidationError(allErrors);
            }
            return config;
          },
        }),
      ],
      providers,
      exports: [NestConfigModule, ...classes],
      global: true,
    };
  }

  private static getConfigProvidersAndValidators(
    options: ConfigModuleOptions,
  ): {
    readonly klass: Type<any>;
    readonly provider: FactoryProvider;
    readonly validator: (config: Record<string, unknown>) => ValidationError[];
  }[] {
    const { load, classTransformOptions, validatorOptions } = options;
    return load.map((klass: Type<any>) => {
      let instance: any;
      const validator = (variables: Record<string, unknown>) => {
        const collectedConfig = ConfigModule.collectRelevantVariables(
          klass,
          variables,
        );
        instance = plainToInstance(klass, collectedConfig, {
          enableImplicitConversion: true,
          ...classTransformOptions,
        });
        storeResolvedConfig(klass, instance);
        return validateSync(instance, validatorOptions);
      };
      return {
        klass,
        validator,
        provider: {
          provide: klass,
          useFactory: () => instance,
        },
      };
    });
  }

  private static collectRelevantVariables(
    klass: Type<any>,
    variables: Record<string, unknown>,
  ): Record<string, unknown> {
    const collected: Record<string, unknown> = {};
    const propertiesMetadata: EnvPropertyMetadata[] =
      Reflect.getMetadata(METADATA_KEY, klass) ?? [];
    propertiesMetadata.forEach((metadata) => {
      collected[metadata.propertyKey] = variables[metadata.variableName];
    });
    return collected;
  }

}

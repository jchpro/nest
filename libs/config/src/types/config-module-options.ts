import { Type, ValidationError } from '@nestjs/common';
import { ValidatorOptions } from '@nestjs/common/interfaces/external/validator-options.interface';
import { ConfigModuleOptions as NestConfigModuleOptions } from '@nestjs/config';
import { ClassTransformOptions } from 'class-transformer';

export interface ConfigModuleOptions {

  /**
   * Array of config classes on which environment variables mapping and validation will be run.
   * These classes will be provided by the {@link ConfigModule} and thus available globally in the app.
   * TODO rename to `load` some day.
   */
  readonly classes: Type<any>[];

  /**
   * Nest's original config module options, without `validate` function which is the backbone of this package's inner workings.
   * **Be aware** that no additional checks determining whether provided configuration comes into conflict with `validate` are made.
   */
  readonly nestConfigOptions?: Omit<NestConfigModuleOptions, 'validate'>;

  /**
   * Extra `class-transformer` options passed to `plainToInstance` function, which happens just before validation.
   */
  readonly classTransformOptions?: ClassTransformOptions;

  /**
   * Extra `class-validator` options passed to `validateSync`.
   */
  readonly validatorOptions?: ValidatorOptions;

  /**
   * Error to throw when validation of the config object fails.
   */
  readonly errorFactory?: (validationErrors: ValidationError[]) => any;
}

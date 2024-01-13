import { ValidationError } from 'class-validator';

/**
 * Will be thrown if validation fails during {@link ConfigModule} initialization.
 * For custom error provide {@link ConfigModuleOptions#errorFactory}.
 */
export class EnvPropertiesValidationError extends Error {
  constructor(validationErrors: ValidationError[]) {
    super(validationErrors.map((error) => error.toString()).join('\n'));
  }
}

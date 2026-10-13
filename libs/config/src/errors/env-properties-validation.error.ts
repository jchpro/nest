import { type ValidationError } from 'class-validator';

/**
 * Will be thrown if validation fails during {@link ConfigModule} initialization.
 * For custom error provide {@link ConfigModuleOptions#errorFactory}.
 *
 * If the environment variable name of a failed property is known, the message mentions it
 * (e.g. `MY_FIELD (myField)`), otherwise the `class-validator` message is used.
 */
export class EnvPropertiesValidationError extends Error {
  constructor(
    validationErrors: ValidationError[],
    variableNames: ReadonlyMap<ValidationError, string> = new Map(),
  ) {
    super(
      validationErrors
        .map((error) => EnvPropertiesValidationError.describe(error, variableNames.get(error)))
        .join('\n'),
    );
  }

  private static describe(error: ValidationError, variableName?: string): string {
    if (!variableName || !error.constraints) {
      return error.toString();
    }
    const target = error.target?.constructor?.name;
    const constraints = Object.keys(error.constraints).join(', ');
    return `${target ? `${target}: ` : ''}environment variable ${variableName} (property ${error.property}) has failed the following constraints: ${constraints}`;
  }
}

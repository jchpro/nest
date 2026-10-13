import type { ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { EnvPropertiesValidationError } from '../index.js';

describe('EnvPropertiesValidationError', () => {
  function getMockErrors(count: number): ValidationError[] {
    const errors: ValidationError[] = [];
    for (let i = 0; i < count; i++) {
      const num = i + 1;
      errors.push({
        property: `property_${num}`,
        toString: () => `error_${num}`,
      });
    }
    return errors;
  }

  it('should format error message for multiple input errors', () => {
    // Given
    const inputErrors = getMockErrors(3);

    // When
    const error = new EnvPropertiesValidationError(inputErrors);

    // Then
    expect(error.message).toBe('error_1\nerror_2\nerror_3');
  });

  it('should name the environment variable when it is known', () => {
    // Given
    class MyConfig {}
    const inputError: ValidationError = {
      target: new MyConfig(),
      property: 'myField',
      constraints: { isNotEmpty: 'x', isString: 'y' },
      toString: () => 'original',
    };

    // When
    const error = new EnvPropertiesValidationError(
      [inputError],
      new Map([[inputError, 'MY_FIELD']]),
    );

    // Then
    expect(error.message).toBe(
      'MyConfig: environment variable MY_FIELD (property myField) has failed the following constraints: isNotEmpty, isString',
    );
  });
});

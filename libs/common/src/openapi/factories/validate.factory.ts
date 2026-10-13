import { applyDecorators, UsePipes, ValidationPipe, type ValidationPipeOptions } from "@nestjs/common";
import type { ApiResponseOptions } from "@nestjs/swagger";
import { ApiBadRequestResponse } from '@nestjs/swagger';

/**
 * Returns Controller / Endpoint decorator for attaching `ValidationPipe` with provided options.
 * Applies {@link ApiBadRequestResponse}.
 */
export function ValidateFactory(
  badRequestOptions?: ApiResponseOptions,
  options?: ValidationPipeOptions
) {
  return function Validate(overrides?: ValidationPipeOptions) {
    return applyDecorators(
      ApiBadRequestResponse(badRequestOptions),
      UsePipes(new ValidationPipe({ ...options, ...overrides }))
    );
  }
}

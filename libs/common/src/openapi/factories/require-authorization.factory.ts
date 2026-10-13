import { applyDecorators, SetMetadata } from '@nestjs/common';
import { type ApiResponseOptions } from '@nestjs/swagger';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { REQUIRED_PERMISSIONS } from "../../auth/authorization/consts/metadata-keys.js";

/**
 * Returns Controller / Endpoint decorator for attaching
 * permissions metadata for usage in authorization mechanism.
 */
export function RequireAuthorizationFactory<T>(forbiddenOptions?: ApiResponseOptions) {
  return function RequireAuthorization(...permissions: T[]) {
    return applyDecorators(
      ApiForbiddenResponse(forbiddenOptions),
      SetMetadata<string, T[]>(REQUIRED_PERMISSIONS, permissions)
    );
  };
}

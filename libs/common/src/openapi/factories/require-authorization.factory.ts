import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiForbiddenResponse } from "../internal/swagger";
import { ApiResponseOptions } from "@nestjs/swagger/dist/decorators/api-response.decorator";
import { REQUIRED_PERMISSIONS } from "../../auth/authorization/consts/metadata-keys";

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

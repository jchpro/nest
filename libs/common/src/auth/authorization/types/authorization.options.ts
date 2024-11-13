import { Type } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";

export interface AuthorizationOptions {

  /**
   * Pass class which implements `AuthorizationService`.
   * Module must be able to provide all it's dependencies.
   */
  serviceClass: Type<AuthorizationService<any, any>>;

  /**
   * Factory for creating `forbidden` exception, by default Nest's `ForbiddenException` will be used.
   */
  forbiddenFactory?: () => any;
}

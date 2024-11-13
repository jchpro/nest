import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_USER_RESOLVER, AUTHORIZATION_OPTIONS, AUTHORIZATION_SERVICE } from "../consts/injection-tokens";
import { REQUIRED_PERMISSIONS } from "../consts/metadata-keys";
import { PublicAccessAdvisorService } from "../services/public-access-advisor.service";
import { AuthUserResolver } from "../types/auth-user-resolver";
import { AuthorizationOptions } from "../types/authorization.options";
import { AuthorizationService } from "../types/authorization.service";

@Injectable()
export class PermissionsGuard<TRequest = any> implements CanActivate {

  constructor(
    private readonly publicAccessAdvisorService: PublicAccessAdvisorService,
    private readonly reflector: Reflector,
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: AuthorizationService<any, any>,
    @Inject(AUTHORIZATION_OPTIONS)
    private readonly options: AuthorizationOptions,
    @Inject(AUTH_USER_RESOLVER)
    private readonly userResolver: AuthUserResolver
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.publicAccessAdvisorService.isPublicContext(context);
    if (isPublic) {
      return true;
    }
    const requiredPermissions = this.reflector.getAllAndMerge<any[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<TRequest>();
    const user = this.userResolver(request);
    const result = user ? await this.authorizationService.validateAuthorization(user, requiredPermissions) : false;
    if (!this.options.forbiddenFactory) {
      return result;
    }
    if (!result) {
      throw this.options.forbiddenFactory();
    }
    return true;
  }
}

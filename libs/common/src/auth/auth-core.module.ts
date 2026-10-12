import { type DynamicModule, Module } from '@nestjs/common';
import { AUTH_USER_RESOLVER, AUTHORIZATION_OPTIONS, AUTHORIZATION_SERVICE } from "./authorization/consts/injection-tokens.js";
import { type AuthUserResolver } from "./authorization/types/auth-user-resolver.js";
import { type AuthorizationOptions } from './authorization/types/authorization.options.js';
import { PublicAccessAdvisorService } from './authorization/services/public-access-advisor.service.js';

@Module({})
export class AuthCoreModule {
  static forStrategy(
    userResolver: AuthUserResolver,
    options?: AuthorizationOptions,
    imports: DynamicModule['imports'] = [],
  ): DynamicModule {
    const module: DynamicModule = {
      module: AuthCoreModule,
      imports: [...imports],
      providers: [
        PublicAccessAdvisorService,
        {
          provide: AUTH_USER_RESOLVER,
          useValue: userResolver
        }
      ],
      exports: [
        PublicAccessAdvisorService,
        AUTH_USER_RESOLVER
      ],
    };
    if (options?.serviceClass) {
      module.providers!.push(
        {
          provide: AUTHORIZATION_OPTIONS,
          useValue: options,
        },
        {
          provide: AUTHORIZATION_SERVICE,
          useFactory: (instance) => instance,
          inject: [options.serviceClass],
        },
      );
      module.exports!.push(AUTHORIZATION_OPTIONS, AUTHORIZATION_SERVICE);
    }
    return module;
  }
}

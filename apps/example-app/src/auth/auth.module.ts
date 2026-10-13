import { AuthCoreModule, PermissionsGuard } from '@jchpro/nest-common/auth';
import { ForbiddenException, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DemoAuthorizationService } from './demo-authorization.service.js';
import { demoUserResolver } from './demo-user.js';

/** `AuthCoreModule` only gets the authorization service through its imports. */
@Module({
  providers: [DemoAuthorizationService],
  exports: [DemoAuthorizationService],
})
class DemoAuthorizationModule {}

@Module({
  imports: [
    AuthCoreModule.forStrategy(
      demoUserResolver,
      {
        serviceClass: DemoAuthorizationService,
        forbiddenFactory: () => new ForbiddenException('Missing permissions'),
      },
      [DemoAuthorizationModule],
    ),
  ],
  // Lets `@Public()` endpoints through and checks the permissions the others require
  providers: [{ provide: APP_GUARD, useClass: PermissionsGuard }],
})
export class AuthModule {}

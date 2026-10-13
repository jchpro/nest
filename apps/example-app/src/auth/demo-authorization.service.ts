import { type AuthorizationService } from '@jchpro/nest-common/auth';
import { Injectable } from '@nestjs/common';
import { type DemoUser } from './demo-user.js';
import { type Permission } from './permission.js';

@Injectable()
export class DemoAuthorizationService implements AuthorizationService<DemoUser, Permission> {
  validateAuthorization(user: DemoUser, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every((permission) => user.permissions.includes(permission));
  }
}

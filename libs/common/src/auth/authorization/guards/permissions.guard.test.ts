import { type ExecutionContext } from '@nestjs/common';
import { type HttpArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthorizationService } from '../types/authorization.service.js';
import { PermissionsGuard } from './permissions.guard.js';

function getMockContext(): ExecutionContext {
  return {
    switchToHttp(): HttpArgumentsHost {
      return {
        getRequest(): any {
          return {
            user: { name: 'joe' },
          };
        },
      } as HttpArgumentsHost;
    },
    getClass<T = any>(): any {
      return {};
    },
    getHandler(): Function {
      return () => {};
    },
  } as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let authService: AuthorizationService<any, any>;
  let guard: PermissionsGuard;
  let useReflectedPermissions: string[] | undefined;
  let useValidateAuth: boolean = false;
  let useIsPublic: boolean = false;

  function createGuard() {
    guard = new PermissionsGuard(
      { isPublicContext: () => useIsPublic } as any,
      { getAllAndMerge: () => useReflectedPermissions as any } as any,
      authService,
      { serviceClass: {} as any },
      (req) => req.user
    );
  }

  beforeEach(() => {
    authService = {
      validateAuthorization(): boolean {
        return useValidateAuth;
      },
    };
    useValidateAuth = false;
    useReflectedPermissions = undefined;
    useIsPublic = false;
    createGuard();
  });

  it('should pass through when in public context', async () => {
    // Given
    useIsPublic = true;

    // Then
    expect(await guard.canActivate(getMockContext())).toBe(true);
  });

  it('should pass through when no permissions are reflected', async () => {
    // Given
    useReflectedPermissions = Math.random() < 0.5 ? undefined : [];

    // Then
    expect(await guard.canActivate(getMockContext())).toBe(true);
  });

  it('should call authorization service validate and return result', async () => {
    // Given
    useReflectedPermissions = ['one', 'two'];
    useValidateAuth = true;
    const validateSpy = vi
      .spyOn(authService, 'validateAuthorization');

    // When
    const result = await guard.canActivate(getMockContext());

    // Then
    expect(validateSpy).toHaveBeenCalledWith({ name: 'joe' }, ['one', 'two']);
    expect(validateSpy).toHaveReturned();
    expect(result).toBe(true);
  });
});

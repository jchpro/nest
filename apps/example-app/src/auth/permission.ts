import { RequireAuthorizationFactory } from '@jchpro/nest-common/openapi';

export enum Permission {
  CatsWrite = 'cats:write',
  OwnersWrite = 'owners:write',
}

/** Endpoint decorator: requires the permissions, documents the `403` response. */
export const RequireAuthorization = RequireAuthorizationFactory<Permission>({ description: 'Missing permissions' });

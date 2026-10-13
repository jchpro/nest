import { Public, AuthCoreModule, PermissionsGuard, type AuthorizationService } from '@jchpro/nest-common/auth';
import { RequireAuthorizationFactory } from '@jchpro/nest-common/openapi';
import { Controller, ForbiddenException, Get, Injectable, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';

enum Permission {
  BooksRead = 'books:read',
  BooksWrite = 'books:write',
}

const RequireAuthorization = RequireAuthorizationFactory<Permission>({ description: 'Missing permissions' });

interface TestUser {
  readonly permissions: Permission[];
}

// Users are chosen with a header, as a stand-in for real authentication
const users: Record<string, TestUser> = {
  reader: { permissions: [Permission.BooksRead] },
  writer: { permissions: [Permission.BooksRead, Permission.BooksWrite] },
};

@Injectable()
class TestAuthorizationService implements AuthorizationService<TestUser, Permission> {
  validateAuthorization(user: TestUser, requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every((permission) => user.permissions.includes(permission));
  }
}

@Module({
  providers: [TestAuthorizationService],
  exports: [TestAuthorizationService],
})
class TestAuthorizationModule {}

@Controller('books')
@RequireAuthorization(Permission.BooksRead)
class BooksController {
  @Get('catalog')
  @Public()
  catalog() {
    return 'public';
  }

  @Get()
  list() {
    return 'list';
  }

  @Get('write')
  @RequireAuthorization(Permission.BooksWrite)
  write() {
    return 'write';
  }

  @Get('unprotected-by-metadata')
  @Public()
  @RequireAuthorization(Permission.BooksWrite)
  publicBeatsPermissions() {
    return 'public wins';
  }
}

@Controller('open')
class OpenController {
  @Get()
  open() {
    return 'no permissions required';
  }
}

@Module({
  imports: [
    AuthCoreModule.forStrategy(
      (request) => users[request.headers['x-test-user'] as string],
      {
        serviceClass: TestAuthorizationService,
        forbiddenFactory: () => new ForbiddenException('Missing permissions'),
      },
      [TestAuthorizationModule],
    ),
  ],
  controllers: [BooksController, OpenController],
  providers: [{ provide: APP_GUARD, useClass: PermissionsGuard }],
})
class TestAppModule {}

describe('@Public, PermissionsGuard and RequireAuthorizationFactory', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createApp({ imports: [TestAppModule] });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('lets anybody into a public endpoint of a protected controller', async () => {
    const res = await testApp.http.get('/books/catalog');

    expect(res.status).toBe(200);
    expect(res.text).toBe('public');
  });

  it('lets a user with the controller\'s permission in', async () => {
    const res = await testApp.http.get('/books').set('X-Test-User', 'reader');

    expect(res.status).toBe(200);
  });

  it('merges the permissions of the controller and the endpoint', async () => {
    const allowed = await testApp.http.get('/books/write').set('X-Test-User', 'writer');
    const forbidden = await testApp.http.get('/books/write').set('X-Test-User', 'reader');

    expect(allowed.status).toBe(200);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.message).toBe('Missing permissions');
  });

  it('refuses a request without a user', async () => {
    const res = await testApp.http.get('/books');

    expect(res.status).toBe(403);
  });

  it('refuses a user the resolver doesn\'t know', async () => {
    const res = await testApp.http.get('/books').set('X-Test-User', 'stranger');

    expect(res.status).toBe(403);
  });

  it('treats an endpoint marked as public as public even when it requires permissions', async () => {
    const res = await testApp.http.get('/books/unprotected-by-metadata');

    expect(res.status).toBe(200);
  });

  it('lets everybody into an endpoint which requires no permissions', async () => {
    const res = await testApp.http.get('/open');

    expect(res.status).toBe(200);
  });
});

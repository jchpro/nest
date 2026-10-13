import {
  DEFAULT_THROTTLER_TIERS,
  ThrottleContent,
  ThrottleLogin,
  ThrottleNormal,
  ThrottleStrict,
  ThrottleUserWrite,
  type ThrottlerTierLimit,
} from '@jchpro/nest-common/throttling';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';

// The default tiers, with small limits where a test needs to exceed them
const tiers: Record<string, ThrottlerTierLimit> = {
  ...DEFAULT_THROTTLER_TIERS,
  auth: { ttl: 60_000, limit: 3 },
  authAccount: { ...DEFAULT_THROTTLER_TIERS.authAccount, limit: 3 },
  userWrite: { ...DEFAULT_THROTTLER_TIERS.userWrite, limit: 2 },
};

@Controller()
class TestController {
  @Get('strict')
  @ThrottleStrict()
  strict() {
    return 'strict';
  }

  @Get('normal')
  @ThrottleNormal()
  normal() {
    return 'normal';
  }

  @Get('content')
  @ThrottleContent()
  content() {
    return 'content';
  }

  @Post('login')
  @ThrottleLogin()
  login(@Body() body: { email?: string }) {
    return body.email;
  }

  @Post('save')
  @ThrottleUserWrite()
  save() {
    return 'saved';
  }
}

describe('Throttling', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createApp(
      {
        imports: [ThrottlerModule.forRoot(Object.entries(tiers).map(([name, options]) => ({ name, ...options })))],
        controllers: [TestController],
      },
      (app) => {
        // Lets the tests pretend to be different clients with `X-Forwarded-For`
        (app as NestExpressApplication).set('trust proxy', true);
        // A stand-in for authentication: the user comes from a header
        app.use((req: any, res: any, next: () => void) => {
          const user = req.header('x-test-user');
          req.user = user ? { _id: user } : undefined;
          next();
        });
      },
    );
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  const from = (ip: string) => ({ 'X-Forwarded-For': ip });

  describe('tiers', () => {
    it('rejects a request over the limit of the strict tier with 429 and Retry-After', async () => {
      const first = await testApp.http.get('/strict').set(from('10.0.0.1'));
      const second = await testApp.http.get('/strict').set(from('10.0.0.1'));

      expect(first.status).toBe(200);
      expect(second.status).toBe(429);
      expect(Number(second.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('counts the clients separately', async () => {
      const one = await testApp.http.get('/strict').set(from('10.0.0.2'));
      const other = await testApp.http.get('/strict').set(from('10.0.0.3'));

      expect(one.status).toBe(200);
      expect(other.status).toBe(200);
    });

    it('answers with the IETF RateLimit headers instead of the legacy per-tier ones', async () => {
      const first = await testApp.http.get('/normal').set(from('10.0.1.1'));
      const second = await testApp.http.get('/normal').set(from('10.0.1.1'));

      expect(first.headers['ratelimit-limit']).toBe('100');
      expect(first.headers['ratelimit-remaining']).toBe('99');
      expect(first.headers['ratelimit-policy']).toBe('"normal";q=100;w=60');
      expect(second.headers['ratelimit-remaining']).toBe('98');
      expect(Object.keys(second.headers).filter((name) => name.startsWith('x-ratelimit'))).toEqual([]);
    });

    it('describes the content tier in its own policy', async () => {
      const res = await testApp.http.get('/content').set(from('10.0.1.2'));

      expect(res.headers['ratelimit-policy']).toBe('"content";q=300;w=60');
    });

    it('does not let one tier eat into another', async () => {
      await testApp.http.get('/strict').set(from('10.0.2.1'));
      const strictAgain = await testApp.http.get('/strict').set(from('10.0.2.1'));
      const normal = await testApp.http.get('/normal').set(from('10.0.2.1'));

      expect(strictAgain.status).toBe(429);
      expect(normal.status).toBe(200);
      expect(normal.headers['ratelimit-remaining']).toBe('99');
    });

    it('reports the rejection of a request over the limit with a plain Retry-After', async () => {
      await testApp.http.get('/strict').set(from('10.0.3.1'));
      const res = await testApp.http.get('/strict').set(from('10.0.3.1'));

      expect(res.status).toBe(429);
      expect(res.headers['retry-after']).toBeDefined();
      expect(Object.keys(res.headers).filter((name) => name.startsWith('retry-after-'))).toEqual([]);
    });
  });

  describe('@ThrottleLogin', () => {
    it('limits the attempts per IP address', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) {
        const res = await testApp.http.post('/login').set(from('10.1.0.1')).send({ email: `person-${i}@example.com` });
        statuses.push(res.status);
      }

      expect(statuses).toEqual([201, 201, 201, 429]);
    });

    it('limits the attempts per e-mail address, whatever the IP address', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) {
        const res = await testApp.http.post('/login').set(from(`10.1.1.${i + 1}`)).send({ email: 'victim@example.com' });
        statuses.push(res.status);
      }
      const otherAccount = await testApp.http.post('/login').set(from('10.1.1.9')).send({ email: 'someone-else@example.com' });

      expect(statuses).toEqual([201, 201, 201, 429]);
      expect(otherAccount.status).toBe(201);
    });

    it('treats the e-mail case-insensitively', async () => {
      const statuses: number[] = [];
      const variants = ['Case@Example.com', 'case@example.com', ' CASE@example.com ', 'cASE@EXAMPLE.COM'];
      for (const [i, email] of variants.entries()) {
        const res = await testApp.http.post('/login').set(from(`10.1.2.${i + 1}`)).send({ email });
        statuses.push(res.status);
      }

      expect(statuses).toEqual([201, 201, 201, 429]);
    });
  });

  describe('@ThrottleUserWrite', () => {
    it('limits the requests per user, not per IP address', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 3; i++) {
        const res = await testApp.http.post('/save').set(from('10.2.0.1')).set('X-Test-User', 'ann');
        statuses.push(res.status);
      }
      const otherUser = await testApp.http.post('/save').set(from('10.2.0.1')).set('X-Test-User', 'bob');

      expect(statuses).toEqual([201, 201, 429]);
      expect(otherUser.status).toBe(201);
    });

    it('follows the same user from another IP address', async () => {
      await testApp.http.post('/save').set(from('10.2.1.1')).set('X-Test-User', 'carol');
      await testApp.http.post('/save').set(from('10.2.1.2')).set('X-Test-User', 'carol');
      const res = await testApp.http.post('/save').set(from('10.2.1.3')).set('X-Test-User', 'carol');

      expect(res.status).toBe(429);
    });
  });
});

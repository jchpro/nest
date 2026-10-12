import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerRequest } from '@nestjs/throttler';
import { describe, expect, it, vi } from 'vitest';
import { RateLimitHeadersGuard } from './rate-limit-headers.guard.js';

function createResponse() {
  const headers = new Map<string, any>();
  const setHeader = (name: string, value: any) => headers.set(name.toLowerCase(), value);
  return {
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader,
    // Express-style alias used internally by `@nestjs/throttler`
    header: setHeader,
    removeHeader: (name: string) => headers.delete(name.toLowerCase()),
  };
}

function createContext(res: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

async function createGuard(increment: (...args: any[]) => Promise<any>): Promise<RateLimitHeadersGuard> {
  const storageService = { increment };
  const options = { throttlers: [{ name: 'normal', ttl: 60_000, limit: 100 }] };
  const guard = new RateLimitHeadersGuard(options as any, storageService as any, {} as any);
  await guard.onModuleInit();
  return guard;
}

function requestPropsFor(context: ExecutionContext): ThrottlerRequest {
  return {
    context,
    limit: 100,
    ttl: 60_000,
    throttler: { name: 'normal', ttl: 60_000, limit: 100 },
    blockDuration: 60_000,
    getTracker: async () => 'tracker',
    generateKey: () => 'key',
  };
}

describe('RateLimitHeadersGuard', () => {

  it('replaces the legacy suffixed X-RateLimit-* headers with unprefixed RateLimit-* fields when allowed', async () => {
    // Given
    const res = createResponse();
    const guard = await createGuard(async () => ({
      totalHits: 3,
      timeToExpire: 45,
      isBlocked: false,
      timeToBlockExpire: 0,
    }));

    // When
    const allowed = await (guard as any).handleRequest(requestPropsFor(createContext(res)));

    // Then
    expect(allowed).toBe(true);
    expect(res.getHeader('X-RateLimit-Limit-normal')).toBeUndefined();
    expect(res.getHeader('X-RateLimit-Remaining-normal')).toBeUndefined();
    expect(res.getHeader('X-RateLimit-Reset-normal')).toBeUndefined();
    expect(res.getHeader('RateLimit-Limit')).toBe(100);
    expect(res.getHeader('RateLimit-Remaining')).toBe(97);
    expect(res.getHeader('RateLimit-Policy')).toBe('"normal";q=100;w=60');
  });

  it('replaces the suffixed Retry-After header and rethrows when blocked', async () => {
    // Given
    const res = createResponse();
    const guard = await createGuard(async () => ({
      totalHits: 101,
      timeToExpire: 60,
      isBlocked: true,
      timeToBlockExpire: 12,
    }));

    // When / Then
    await expect((guard as any).handleRequest(requestPropsFor(createContext(res)))).rejects.toThrow();
    expect(res.getHeader('Retry-After-normal')).toBeUndefined();
    expect(res.getHeader('Retry-After')).toBe(12);
    expect(res.getHeader('RateLimit-Limit')).toBeUndefined();
  });

  it.each([
    ['the more restrictive tier is checked first', ['auth', 'authAccount']],
    ['the more restrictive tier is checked last', ['authAccount', 'auth']],
  ])('reports the tier with the fewest remaining requests when several apply (%s)', async (_name, order) => {
    // Given: `auth` has 2 requests left, `authAccount` has 7
    const hits = { auth: 3, authAccount: 3 };
    const limits = { auth: 5, authAccount: 10 };
    const res = createResponse();
    const context = createContext(res);
    const guard = await createGuard(async (_key: string, _ttl: number, _limit: number, _block: number, name: 'auth' | 'authAccount') => ({
      totalHits: hits[name],
      timeToExpire: 45,
      isBlocked: false,
      timeToBlockExpire: 0,
    }));

    // When
    for (const name of order as ('auth' | 'authAccount')[]) {
      const throttler = { name, ttl: 60_000, limit: limits[name] };
      await (guard as any).handleRequest({ ...requestPropsFor(context), throttler, limit: limits[name] });
    }

    // Then
    expect(res.getHeader('RateLimit-Remaining')).toBe(2);
    expect(res.getHeader('RateLimit-Limit')).toBe(5);
    expect(res.getHeader('RateLimit-Policy')).toBe('"auth";q=5;w=60');
  });

  it('leaves headers untouched when `setHeaders` is disabled for the tier', async () => {
    // Given
    const res = createResponse();
    const storageService = { increment: vi.fn().mockResolvedValue({ totalHits: 3, timeToExpire: 45, isBlocked: false, timeToBlockExpire: 0 }) };
    const options = { throttlers: [{ name: 'normal', ttl: 60_000, limit: 100, setHeaders: false }] };
    const guard = new RateLimitHeadersGuard(options as any, storageService as any, {} as any);
    await guard.onModuleInit();

    // When
    const allowed = await (guard as any).handleRequest({
      ...requestPropsFor(createContext(res)),
      throttler: { name: 'normal', ttl: 60_000, limit: 100, setHeaders: false },
    });

    // Then
    expect(allowed).toBe(true);
    expect(res.getHeader('RateLimit-Limit')).toBeUndefined();
    expect(res.getHeader('RateLimit-Remaining')).toBeUndefined();
    expect(res.getHeader('RateLimit-Policy')).toBeUndefined();
  });

});

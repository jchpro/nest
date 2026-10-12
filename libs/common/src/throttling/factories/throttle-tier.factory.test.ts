import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { RateLimitHeadersGuard } from '../guards/rate-limit-headers.guard.js';
import { ThrottleTierFactory } from './throttle-tier.factory.js';

const TIERS = {
  strict: { ttl: 10_000, limit: 1 },
  normal: { ttl: 60_000, limit: 100 },
  content: { ttl: 60_000, limit: 300 },
};

describe('ThrottleTierFactory', () => {

  it('skips every tier other than the selected one', () => {
    @ThrottleTierFactory('normal', TIERS)
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBeUndefined();
  });

  it('applies `RateLimitHeadersGuard`', () => {
    @ThrottleTierFactory('strict', TIERS)
    class MyController {}

    expect(Reflect.getMetadata(GUARDS_METADATA, MyController)).toEqual([RateLimitHeadersGuard]);
  });

  it('leaves every selected tier active when given several', () => {
    @ThrottleTierFactory(['strict', 'normal'], TIERS)
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBeUndefined();
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBeUndefined();
  });

  it('throws for an unknown tier name', () => {
    expect(() => ThrottleTierFactory('unknown', TIERS)).toThrow();
    expect(() => ThrottleTierFactory(['normal', 'unknown'], TIERS)).toThrow();
  });

});

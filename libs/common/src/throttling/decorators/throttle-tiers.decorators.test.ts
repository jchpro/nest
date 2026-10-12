import { describe, expect, it } from 'vitest';
import { ThrottleAuth } from './throttle-auth.decorator.js';
import { ThrottleContent } from './throttle-content.decorator.js';
import { ThrottleLogin } from './throttle-login.decorator.js';
import { ThrottleNormal } from './throttle-normal.decorator.js';
import { ThrottleSnapshotWrite } from './throttle-snapshot-write.decorator.js';
import { ThrottleStrict } from './throttle-strict.decorator.js';
import { ThrottleUserWrite } from './throttle-user-write.decorator.js';

describe('ThrottleStrict / ThrottleNormal / ThrottleContent / ThrottleAuth / ThrottleLogin / ThrottleUserWrite / ThrottleSnapshotWrite', () => {

  it('`ThrottleAuth` only leaves the `auth` tier active', () => {
    @ThrottleAuth()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPauthAccount', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', MyController)).toBeUndefined();
  });

  it('`ThrottleLogin` leaves both the `auth` and `authAccount` tiers active', () => {
    @ThrottleLogin()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', MyController)).toBeUndefined();
    expect(Reflect.getMetadata('THROTTLER:SKIPauthAccount', MyController)).toBeUndefined();
  });

  it('`ThrottleStrict` only leaves the `strict` tier active', () => {
    @ThrottleStrict()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBeUndefined();
  });

  it('`ThrottleNormal` only leaves the `normal` tier active', () => {
    @ThrottleNormal()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBeUndefined();
  });

  it('`ThrottleContent` only leaves the `content` tier active', () => {
    @ThrottleContent()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBeUndefined();
  });

  it('`ThrottleUserWrite` only leaves the `userWrite` tier active', () => {
    @ThrottleUserWrite()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauthAccount', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPuserWrite', MyController)).toBeUndefined();
  });

  it('`ThrottleSnapshotWrite` only leaves the `snapshotWrite` tier active', () => {
    @ThrottleSnapshotWrite()
    class MyController {}

    expect(Reflect.getMetadata('THROTTLER:SKIPstrict', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPnormal', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPcontent', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPauthAccount', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPuserWrite', MyController)).toBe(true);
    expect(Reflect.getMetadata('THROTTLER:SKIPsnapshotWrite', MyController)).toBeUndefined();
  });

});

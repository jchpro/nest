import { describe, expect, it } from 'vitest';
import { userIdTracker } from './user-id.tracker.js';

describe('userIdTracker', () => {

  it('tracks by the authenticated user id', () => {
    expect(userIdTracker({ ip: '1.1.1.1', user: { _id: 'abc123' } })).toBe('user:abc123');
  });

  it('gives the same key regardless of the IP address', () => {
    const a = userIdTracker({ ip: '1.1.1.1', user: { _id: 'abc123' } });
    const b = userIdTracker({ ip: '2.2.2.2', user: { _id: 'abc123' } });
    expect(a).toBe(b);
  });

  it.each([
    ['no user', undefined],
    ['user with no _id', {}],
  ])('falls back to the IP address for %s', (_name, user) => {
    expect(userIdTracker({ ip: '1.1.1.1', user })).toBe('1.1.1.1');
  });

});

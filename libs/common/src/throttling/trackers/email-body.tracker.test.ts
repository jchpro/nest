import { describe, expect, it } from 'vitest';
import { emailBodyTracker } from './email-body.tracker.js';

describe('emailBodyTracker', () => {

  it('tracks by the normalized e-mail from the body', () => {
    expect(emailBodyTracker({ ip: '1.1.1.1', body: { email: '  Jane@Example.com ' } })).toBe('email:jane@example.com');
  });

  it('gives the same key regardless of the IP address', () => {
    const a = emailBodyTracker({ ip: '1.1.1.1', body: { email: 'jane@example.com' } });
    const b = emailBodyTracker({ ip: '2.2.2.2', body: { email: 'jane@example.com' } });
    expect(a).toBe(b);
  });

  it.each([
    ['no body', undefined],
    ['no e-mail', {}],
    ['blank e-mail', { email: '   ' }],
    ['non-string e-mail', { email: { $ne: null } }],
  ])('falls back to the IP address for %s', (_name, body) => {
    expect(emailBodyTracker({ ip: '1.1.1.1', body })).toBe('1.1.1.1');
  });

});

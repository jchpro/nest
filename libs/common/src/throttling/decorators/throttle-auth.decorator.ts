import { THROTTLER_TIER_AUTH } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `auth` tier — for credential-related endpoints (registering, resetting a password)
 * that are expensive to serve (password hashing) and attractive to abuse.
 */
export function ThrottleAuth() {
  return ThrottleTierFactory(THROTTLER_TIER_AUTH);
}

import { THROTTLER_TIER_AUTH, THROTTLER_TIER_AUTH_ACCOUNT } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against both the `auth` tier (per IP) and the `authAccount` tier (per e-mail from the request body) —
 * for endpoints checking credentials, so guessing a password is slow both from one address and across many.
 * Needs to run before the endpoint's authentication guard, i.e. be the decorator closest to the method.
 */
export function ThrottleLogin() {
  return ThrottleTierFactory([THROTTLER_TIER_AUTH, THROTTLER_TIER_AUTH_ACCOUNT]);
}

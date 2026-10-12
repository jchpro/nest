import { THROTTLER_TIER_USER_WRITE } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `userWrite` tier — for write-heavy endpoints called frequently by an authenticated
 * client on its own behalf (e.g. autosaving), counted per user rather than per IP.
 */
export function ThrottleUserWrite() {
  return ThrottleTierFactory(THROTTLER_TIER_USER_WRITE);
}

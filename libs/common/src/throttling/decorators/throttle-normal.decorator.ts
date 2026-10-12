import { THROTTLER_TIER_NORMAL } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `normal` tier — for general-purpose public endpoints,
 * e.g. a public bookshelf.
 */
export function ThrottleNormal() {
  return ThrottleTierFactory(THROTTLER_TIER_NORMAL);
}

import { THROTTLER_TIER_STRICT } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `strict` tier — for endpoints with very low abuse tolerance,
 * e.g. a contact form.
 */
export function ThrottleStrict() {
  return ThrottleTierFactory(THROTTLER_TIER_STRICT);
}

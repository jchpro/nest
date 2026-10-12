import { THROTTLER_TIER_CONTENT } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `content` tier — for public content/asset delivery, which tolerates
 * burstier traffic than the `normal` tier (e.g. a page loading several assets at once).
 */
export function ThrottleContent() {
  return ThrottleTierFactory(THROTTLER_TIER_CONTENT);
}

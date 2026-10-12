import { THROTTLER_TIER_SNAPSHOT_WRITE } from '../consts/throttler-tiers.js';
import { ThrottleTierFactory } from '../factories/throttle-tier.factory.js';

/**
 * Rate-limits against the `snapshotWrite` tier — for occasional per-user mutations (e.g. labelling or
 * deleting a saved snapshot) that aren't part of a save loop like `userWrite`-guarded endpoints.
 */
export function ThrottleSnapshotWrite() {
  return ThrottleTierFactory(THROTTLER_TIER_SNAPSHOT_WRITE);
}

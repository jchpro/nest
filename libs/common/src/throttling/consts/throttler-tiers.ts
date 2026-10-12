import { emailBodyTracker } from '../trackers/email-body.tracker.js';
import { userIdTracker } from '../trackers/user-id.tracker.js';

export const THROTTLER_TIER_STRICT = 'strict';
export const THROTTLER_TIER_NORMAL = 'normal';
export const THROTTLER_TIER_CONTENT = 'content';
export const THROTTLER_TIER_AUTH = 'auth';
export const THROTTLER_TIER_AUTH_ACCOUNT = 'authAccount';
export const THROTTLER_TIER_USER_WRITE = 'userWrite';
export const THROTTLER_TIER_SNAPSHOT_WRITE = 'snapshotWrite';

export interface ThrottlerTierLimit {
  ttl: number;
  limit: number;
  /**
   * How long further requests are rejected once the limit is exceeded; equals `ttl` when omitted.
   */
  blockDuration?: number;
  /**
   * What the limit is counted per; the client IP address when omitted.
   */
  getTracker?: (req: Record<string, any>) => string;
}

/**
 * Default per-tier rate limits, tuned for a small VPS deployment. `strict` guards low-tolerance
 * public endpoints (e.g. a contact form), `normal` covers general public read endpoints, and
 * `content` allows for the burstier traffic of serving public content/assets. `auth` limits
 * credential-related endpoints per IP, and `authAccount` complements it for logging in by counting
 * attempts per e-mail address regardless of IP. `userWrite` complements `normal` for endpoints an authenticated
 * client calls frequently on its own behalf (e.g. autosaving), counted per user instead of per IP so one busy
 * account can't starve others sharing a NAT/proxy. `snapshotWrite` is a tighter per-user budget for occasional
 * mutations (e.g. labelling/deleting a saved snapshot) that aren't part of a save loop. Pass a different map to
 * `ThrottlerModule.forRoot()` if a project needs different numbers.
 */
export const DEFAULT_THROTTLER_TIERS: Record<string, ThrottlerTierLimit> = {
  [THROTTLER_TIER_STRICT]: { ttl: 10_000, limit: 1 },
  [THROTTLER_TIER_NORMAL]: { ttl: 60_000, limit: 100 },
  [THROTTLER_TIER_CONTENT]: { ttl: 60_000, limit: 300 },
  [THROTTLER_TIER_AUTH]: { ttl: 60_000, limit: 5 },
  // Deliberately generous with a short block: anyone knowing an e-mail can trigger it and lock that account's logins out
  [THROTTLER_TIER_AUTH_ACCOUNT]: { ttl: 600_000, limit: 20, blockDuration: 300_000, getTracker: emailBodyTracker },
  [THROTTLER_TIER_USER_WRITE]: { ttl: 60_000, limit: 120, getTracker: userIdTracker },
  [THROTTLER_TIER_SNAPSHOT_WRITE]: { ttl: 60_000, limit: 60, getTracker: userIdTracker },
};

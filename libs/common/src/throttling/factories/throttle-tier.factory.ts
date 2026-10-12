import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DEFAULT_THROTTLER_TIERS, type ThrottlerTierLimit } from '../consts/throttler-tiers.js';
import { RateLimitHeadersGuard } from '../guards/rate-limit-headers.guard.js';

/**
 * Builds a controller/endpoint decorator that rate-limits against the given named tier(s)
 * registered via `ThrottlerModule.forRoot()`, skipping every other configured tier so only the
 * selected buckets are tracked per request, and documents the limits in the OpenAPI schema.
 * Passing several tiers applies all of them, and the request is rejected when any is exceeded.
 *
 * Use it either on a whole controller or on individual endpoints, never both: the skip flags of
 * the controller-level decorator can't be overridden by an endpoint-level one.
 */
export function ThrottleTierFactory(tierNames: string | string[], tiers: Record<string, ThrottlerTierLimit> = DEFAULT_THROTTLER_TIERS) {
  const activeTierNames = Array.isArray(tierNames) ? tierNames : [tierNames];
  const limits = activeTierNames.map(name => {
    if (!tiers[name]) {
      throw new Error(`Unknown throttler tier "${name}"`);
    }
    return tiers[name];
  });
  const skippedTierNames = Object.keys(tiers).filter(name => !activeTierNames.includes(name));
  const description = limits
    .map(({ ttl, limit }) => `maximum ${limit} request(s) per ${ttl / 1000}s`)
    .join(', or ');
  return applyDecorators(
    UseGuards(RateLimitHeadersGuard),
    SkipThrottle(Object.fromEntries(skippedTierNames.map(name => [name, true]))),
    ApiTooManyRequestsResponse({ description: `Rate limit reached: ${description}` }),
  );
}

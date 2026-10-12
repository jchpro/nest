import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerRequest } from '@nestjs/throttler';

/**
 * Drop-in replacement for `@nestjs/throttler`'s `ThrottlerGuard` that replaces its legacy,
 * per-tier-suffixed `X-RateLimit-*-<tier>` response headers (e.g. `X-RateLimit-Limit-normal`)
 * with the unprefixed `RateLimit-*` fields from the IETF HTTPAPI "RateLimit header fields for
 * HTTP" draft, which represents the tier as a named policy inside the header *value*
 * (`RateLimit-Policy: "normal";q=100;w=60`) rather than baking it into the header *name*.
 *
 * Delegates all actual rate-limiting (tracking, storage, blocking) to the base guard via
 * `super.handleRequest()` and only translates the headers it already wrote, so this stays in
 * sync with the library's own logic across upgrades instead of re-implementing it.
 */
@Injectable()
export class RateLimitHeadersGuard extends ThrottlerGuard {

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, throttler, limit, ttl } = requestProps;
    const { res } = this.getRequestResponse(context);
    const tierName = throttler.name ?? 'default';
    const suffix = tierName === 'default' ? '' : `-${tierName}`;

    try {
      const allowed = await super.handleRequest(requestProps);
      this.replaceRateLimitHeaders(res, suffix, tierName, limit, ttl);
      return allowed;
    } catch (err) {
      this.replaceRetryAfterHeader(res, suffix);
      throw err;
    }
  }

  private replaceRateLimitHeaders(res: Record<string, any>, suffix: string, tierName: string, limit: number, ttl: number): void {
    const remaining = res.getHeader(`${this.headerPrefix}-Remaining${suffix}`);
    [`${this.headerPrefix}-Limit${suffix}`, `${this.headerPrefix}-Remaining${suffix}`, `${this.headerPrefix}-Reset${suffix}`]
      .forEach(name => res.removeHeader(name));
    if (remaining === undefined) {
      // `setHeaders` was disabled for this tier; nothing to translate
      return;
    }
    // When several tiers apply to one request, keep reporting the one closest to being exhausted
    const alreadyReportedRemaining = res.getHeader('RateLimit-Remaining');
    if (alreadyReportedRemaining !== undefined && Number(alreadyReportedRemaining) <= Number(remaining)) {
      return;
    }
    const windowSeconds = Math.round(ttl / 1000);
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Policy', `"${tierName}";q=${limit};w=${windowSeconds}`);
  }

  private replaceRetryAfterHeader(res: Record<string, any>, suffix: string): void {
    if (!suffix) {
      return;
    }
    const retryAfter = res.getHeader(`Retry-After${suffix}`);
    res.removeHeader(`Retry-After${suffix}`);
    if (retryAfter !== undefined) {
      res.setHeader('Retry-After', retryAfter);
    }
  }

}

# Rate limiting (throttling)

## Description

Named rate-limit tiers and decorators on top of `@nestjs/throttler`, plus a guard that answers with the standard
`RateLimit-*` response headers. Import from the `@jchpro/nest-common/throttling` entry point.

## Installation

```shell
# Required peer dependencies
npm i @nestjs/throttler @nestjs/swagger
# Main library, if not already installed
npm i @jchpro/nest-common
```

## Usage

### Register the tiers

Every tier is a named throttler of `ThrottlerModule`. `DEFAULT_THROTTLER_TIERS` holds the ready-made ones
(a map of tier name to `ThrottlerTierLimit`), so you can register them as they are, or pass your own map with the same shape.

```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { DEFAULT_THROTTLER_TIERS } from '@jchpro/nest-common/throttling';

@Module({
  imports: [
    ThrottlerModule.forRoot(
      Object.entries(DEFAULT_THROTTLER_TIERS).map(([name, options]) => ({ name, ...options }))
    ),
  ],
})
export class AppModule {}
```

If the app runs behind a reverse proxy, set Express's `trust proxy`, otherwise every client shares the proxy's IP.

### Apply a tier

```typescript
@Controller('contact-form')
@ThrottleStrict()
export class ContactFormController {}
```

Use a tier decorator either on a whole controller or on individual endpoints, never both: the skip flags set by a
controller-level decorator can't be overridden by an endpoint-level one.

Each decorator applies `RateLimitHeadersGuard`, skips all the other tiers (so only the selected buckets are counted)
and documents the limit as a `429` response in the OpenAPI schema.

| Decorator | Tier | Default limit | Counted per | Meant for |
|---|---|---|---|---|
| `@ThrottleStrict()` | `strict` | 1 / 10 s | IP | low-tolerance public endpoints, e.g. a contact form |
| `@ThrottleNormal()` | `normal` | 100 / 1 min | IP | general public endpoints |
| `@ThrottleContent()` | `content` | 300 / 1 min | IP | serving public content and assets (burstier traffic) |
| `@ThrottleAuth()` | `auth` | 5 / 1 min | IP | expensive credential-related endpoints (register, reset password) |
| `@ThrottleLogin()` | `auth` + `authAccount` | 5 / 1 min per IP, 20 / 10 min per e-mail (blocked for 5 min) | IP and e-mail | endpoints checking credentials |
| `@ThrottleUserWrite()` | `userWrite` | 120 / 1 min | user ID | endpoints an authenticated client calls often, e.g. autosave |
| `@ThrottleSnapshotWrite()` | `snapshotWrite` | 60 / 1 min | user ID | occasional per-user mutations |

`@ThrottleLogin()` must run before the endpoint's authentication guard, so keep it the decorator closest to the method.

The tier names are exported as `THROTTLER_TIER_*` constants.

### Your own tiers

`ThrottleTierFactory(tierNames, tiers?)` builds a decorator for one tier name or several (the request is rejected when
any of them is exceeded). The second argument is the tier map, `DEFAULT_THROTTLER_TIERS` by default. It throws on an unknown tier name.

```typescript
const MY_TIERS = {
  ...DEFAULT_THROTTLER_TIERS,
  report: { ttl: 3_600_000, limit: 10, blockDuration: 600_000 },
};

export const ThrottleReport = () => ThrottleTierFactory('report', MY_TIERS);
```

A `ThrottlerTierLimit` has `ttl` and `limit`, an optional `blockDuration` (how long further requests are rejected after
the limit is exceeded, `ttl` by default) and an optional `getTracker` (what is counted per, the client IP by default).

### Trackers

- `emailBodyTracker` - counts per the `email` field of the (already parsed) JSON body, case-insensitive; falls back to the IP.
- `userIdTracker` - counts per `req.user._id`; falls back to the IP for unauthenticated requests.

### Response headers

`RateLimitHeadersGuard` extends `ThrottlerGuard` and replaces its per-tier `X-RateLimit-*-<tier>` headers with the
unprefixed fields of the IETF "RateLimit header fields for HTTP" draft:

```text
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Policy: "normal";q=100;w=60
```

When several tiers apply to one request, the one closest to being exhausted is reported. A rejected request carries a plain `Retry-After`.

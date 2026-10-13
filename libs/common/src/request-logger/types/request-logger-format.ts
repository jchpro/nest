/**
 * `morgan` predefined formats. Real object, so it can be used at runtime, e.g. passed to `IsEnum`.
 */
export const RequestLoggerFormat = {
  DEV: 'dev',
  SHORT: 'short',
  TINY: 'tiny',
  COMBINED: 'combined',
  COMMON: 'common',
} as const;

export type RequestLoggerFormat = typeof RequestLoggerFormat[keyof typeof RequestLoggerFormat];

import { Transform } from 'class-transformer';

/**
 * Coerces raw input value to `boolean`, discarding original transformation metadata.
 * Strings interpreted as `true` are:
 *  - parsable as finite numbers greater than 0;
 *  - "true", case-insensitive.
 * Non-string inputs are processed using standard JavaScript `!!value` coercion.
 */
export function CoerceBoolean() {
  return Transform(
    (params) => {
      const value: unknown = params.obj[params.key];
      if (typeof value === 'string') {
        const asNumber = parseFloat(value);
        if (isFinite(asNumber)) {
          return asNumber > 0;
        }
        switch (value.toLowerCase().trim()) {
          case 'true':
            return true;
          default:
            return false;
        }
      }
      return !!value;
    },
    {
      toClassOnly: true,
    },
  );
}

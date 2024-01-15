import { Transform } from 'class-transformer';

/**
 * Coerces raw input value to `boolean`, discarding original transformation metadata.
 */
export function CoerceBoolean() {
  return Transform(
    (params) => {
      const value: unknown = params.obj[params.key];
      if (typeof value === 'string') {
        switch (value.toLowerCase().trim()) {
          case '1':
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

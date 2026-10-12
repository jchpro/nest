import { Transform } from 'class-transformer';

/**
 * Normalizes a property to an array. Needed for query-string array params: Express's query
 * parser (qs) only produces an array when the key repeats (`?id=a&id=b`) — a single occurrence
 * (`?id=a`) comes through as a bare string, which then fails `class-validator`'s `each: true`.
 */
export function CoerceArray() {
  return Transform(
    (params) => {
      const value: unknown = params.obj[params.key];
      if (value === undefined || value === null) {
        return value;
      }
      return Array.isArray(value) ? value : [value];
    },
    {
      toClassOnly: true,
    },
  );
}

import { Transform } from 'class-transformer';

export function CoerceBoolean(options?: {
  optional?: boolean;
}) {
  return Transform(
    (params) => {
      const value: unknown = params.obj[params.key];
      if (options?.optional && (value === undefined || value === null)) {
        return;
      }
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

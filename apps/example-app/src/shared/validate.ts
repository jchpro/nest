import { ValidateFactory } from '@jchpro/nest-common/openapi';

/** Controller decorator: validates and transforms the input, and documents the `400` response. */
export const Validate = ValidateFactory(
  { description: 'Invalid request' },
  { transform: true, whitelist: true, transformOptions: { enableImplicitConversion: true } },
);

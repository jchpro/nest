import { DocumentBuilder } from '@nestjs/swagger';

export const OPENAPI_CONFIG = new DocumentBuilder()
  .setTitle('Example app API')
  .setDescription('Example app for @jchpro/nest libraries.')
  .build();

import { GlobalExceptionHandler, CommonExceptionHandlerBehaviorHttp, LoggerFactory, LogLevels } from '@jchpro/nest-common';
import { SwaggerUiFactory } from '@jchpro/nest-common/openapi';
import { RequestLoggerFactory } from '@jchpro/nest-common/request-logger';
import { ConfigResolver } from '@jchpro/nest-config';
import { Migrator } from '@jchpro/nest-mongoose';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppConfig, Environment } from './app.config.js';
import { AppModule } from './app.module.js';
import { DEMO_USER_HEADER } from './auth/demo-user.js';

async function bootstrap() {
  // The config is resolved as soon as `AppModule` is imported, so it is available before the app is created
  const config = ConfigResolver.get(AppConfig)!;
  const production = config.environment === Environment.Production;

  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory.create(production ? LogLevels.PRODUCTION : LogLevels.DEVELOPMENT),
  });

  app.use(RequestLoggerFactory.create(config.requestLogFormat));
  GlobalExceptionHandler.setup(app, { http: new CommonExceptionHandlerBehaviorHttp(production) });

  const swaggerUi = SwaggerUiFactory.create(
    app,
    new DocumentBuilder()
      .setTitle('Example app')
      .setDescription('Cats and their owners, built with the @jchpro/nest-* libraries')
      .setVersion('1.0')
      // Write endpoints are "secured" by choosing a demo user, see `auth/demo-user.ts`
      .addApiKey({ type: 'apiKey', name: DEMO_USER_HEADER, in: 'header' }, 'demo-user')
      .build(),
  );
  swaggerUi.serve('docs', { serveDoc: true });

  // Rejects when a migration fails, so the app does not start on a half-migrated database
  await new Migrator(app).up();

  await app.listen(config.port);
}

bootstrap();

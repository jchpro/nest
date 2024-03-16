import { CommonExceptionHandlerBehaviorHttp, GlobalExceptionHandler, LoggerFactory, LogLevels } from '@jchpro/nest-common';
import { SwaggerUiFactory } from '@jchpro/nest-common/openapi';
import { RequestLoggerFactory } from '@jchpro/nest-common/request-logger';
import { ConfigResolver } from '@jchpro/nest-config';
import { Migrator } from '@jchpro/nest-mongoose';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './config/core.config';
import { OPENAPI_CONFIG } from './config/openapi-config';

async function bootstrap() {

  // Get core config
  const coreConfig = ConfigResolver.get(CoreConfig)!;
  const isDev = coreConfig.isDevelopment;

  // Create app
  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory.create(isDev ? LogLevels.DEVELOPMENT : LogLevels.PRODUCTION)
  });

  // Run database migrations
  await new Migrator(app).up();

  // Loggers
  app.use(RequestLoggerFactory.create(isDev ? 'dev' : 'combined'))
  const logger = new Logger('ExampleApp');

  // Exception filter
  GlobalExceptionHandler.setup( app, {
    http: new CommonExceptionHandlerBehaviorHttp(!isDev)
  });

  // Swagger UI
  if (isDev) {
    const swaggerUi = SwaggerUiFactory.create(app, OPENAPI_CONFIG);
    swaggerUi.serve('docs', { serveDoc: true });
    logger.log('Serving Swagger UI');
  }

  // Start server
  await app.listen(coreConfig.serverPort);
  logger.log(`Server listening at port ${coreConfig.serverPort}`);
}
bootstrap();

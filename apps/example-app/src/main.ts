import { ConfigResolver } from '@jchpro/nest-config';
import { LoggerFactory, LogLevels } from '@jchpro/nest-core';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './config/core.config';

async function bootstrap() {

  // Get core config
  const coreConfig = ConfigResolver.get(CoreConfig)!;
  const isDev = coreConfig.isDevelopment;

  // Create app
  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory.create(isDev ? LogLevels.DEVELOPMENT : LogLevels.PRODUCTION)
  });

  // Logger
  const logger = new Logger('ExampleApp');

  // Start server
  await app.listen(coreConfig.serverPort);
  logger.log(`Server listening at port ${coreConfig.serverPort}`);
}
bootstrap();

import { DEFAULT_THROTTLER_TIERS } from '@jchpro/nest-common/throttling';
import { ConfigModule } from '@jchpro/nest-config';
import { MongooseCrudModule, SingleConnectionSchemaRefsModule } from '@jchpro/nest-mongoose';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from './app.config.js';
import { AuthModule } from './auth/auth.module.js';
import { demoUserMiddleware } from './auth/demo-user.js';
import { CatsModule } from './cats/cats.module.js';
import { OwnersModule } from './owners/owners.module.js';

@Module({
  imports: [
    // Loads and validates the config class, which is then available for injection everywhere
    ConfigModule.forRoot({ load: [AppConfig] }),
    MongooseModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({ uri: config.mongoUri }),
    }),
    // `QueryService` with a cap for the page size
    MongooseCrudModule.forRoot({ maxLimit: 50 }),
    // The tiers behind the `@Throttle*()` decorators
    ThrottlerModule.forRoot(Object.entries(DEFAULT_THROTTLER_TIERS).map(([name, options]) => ({ name, ...options }))),
    AuthModule,
    CatsModule,
    OwnersModule,
    // Walks the schemas of all the registered models, so it goes after the modules registering them
    SingleConnectionSchemaRefsModule.forRoot(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(demoUserMiddleware).forRoutes('*path');
  }
}

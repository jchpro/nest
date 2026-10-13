import { ConfigModule } from '@jchpro/nest-config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config.js';

@Module({
  imports: [
    // Loads and validates the config class, which is then available for injection everywhere
    ConfigModule.forRoot({ load: [AppConfig] }),
    MongooseModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({ uri: config.mongoUri }),
    }),
  ],
})
export class AppModule {}

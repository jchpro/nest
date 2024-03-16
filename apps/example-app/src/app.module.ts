import { ConfigModule } from '@jchpro/nest-config';
import { MongoMigrateModule } from '@jchpro/nest-mongoose';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreConfig } from './config/core.config';
import { StatusController } from './core/controllers/status.controller';
import migrations from './app.migrations';

@Module({
  imports: [
    ConfigModule.forRoot({
      classes: [CoreConfig]
    }),
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        return {
          uri: coreConfig.mongodbUri
        };
      },
      inject: [CoreConfig]
    }),
    MongoMigrateModule.withMigrations(migrations),
  ],
  providers: [
  ],
  controllers: [
    StatusController
  ]
})
export class AppModule { }

import { ConfigModule } from '@jchpro/nest-config';
import { MongoMigrateModule, MongooseCrudModule } from '@jchpro/nest-mongoose';
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreConfig } from './config/core.config';
import { StatusController } from './core/controllers/status.controller';
import { CatsModule } from './cats/cats.module';
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
    MongooseCrudModule.forRoot({
      maxLimit: 50
    }),
    CatsModule,
    RouterModule.register([
      {
        path: 'cats',
        module: CatsModule
      }
    ])
  ],
  providers: [
  ],
  controllers: [
    StatusController
  ]
})
export class AppModule { }

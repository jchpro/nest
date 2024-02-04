import { ConfigModule } from '@jchpro/nest-config';
import { Module } from '@nestjs/common';
import { CoreConfig } from './config/core.config';
import { StatusController } from './core/controllers/status.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      classes: [CoreConfig]
    })
  ],
  providers: [
  ],
  controllers: [
    StatusController
  ]
})
export class AppModule { }

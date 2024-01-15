import { ConfigModule } from '@jchpro/nest-config';
import { Module } from '@nestjs/common';
import { CoreConfig } from './config/core.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      classes: [CoreConfig]
    })
  ]
})
export class AppModule { }

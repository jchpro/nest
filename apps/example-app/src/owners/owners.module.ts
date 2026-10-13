import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsModule } from '../cats/cats.module.js';
import { Owner, OwnerSchema } from './owner.schema.js';
import { OwnersController } from './owners.controller.js';
import { OwnersService } from './owners.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Owner.name, schema: OwnerSchema }]), CatsModule],
  controllers: [OwnersController],
  providers: [OwnersService],
})
export class OwnersModule {}

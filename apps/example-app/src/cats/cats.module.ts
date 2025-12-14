import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './controllers/cats.controller';
import { Cat, CatSchema } from './schemas/cat.schema';
import { Owner, OwnerSchema } from './schemas/owner.schema';
import { CatsService } from './services/cats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cat.name, schema: CatSchema },
      { name: Owner.name, schema: OwnerSchema }
    ])
  ],
  controllers: [
    CatsController
  ],
  providers: [
    CatsService
  ],
  exports: [
    CatsService
  ]
})
export class CatsModule {}

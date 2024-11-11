import { QueryResult } from '@jchpro/nest-common';
import { QueryService } from '@jchpro/nest-mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCatDto } from '../dtos/create-cat.dto';
import { CatQuery } from '../queries/cat.query';
import { Cat, CatDocument } from '../schemas/cat.schema';

@Injectable()
export class CatsService {

  constructor(
    @InjectModel(Cat.name) private readonly catModel: Model<CatDocument>,
    private readonly queryService: QueryService,
  ) {
  }

  query(query: CatQuery): Promise<QueryResult<CatDocument>> {
    return this.queryService.execute(this.catModel, query, query);
  }

  create(dto: CreateCatDto): Promise<CatDocument> {
    return this.catModel.create({
      name: dto.name,
      birthDate: dto.birthDate,
      weightG: dto.weightG,
      isCute: true
    });
  }

  findById(id: string): Promise<CatDocument | null> {
    return this.catModel.findById(id).exec();
  }

}

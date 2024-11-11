import { QueryResult } from '@jchpro/nest-common';
import { ApiQueryResultResponse, ApiSelfTag } from '@jchpro/nest-common/openapi';
import { Body, Controller, Delete, Get, NotFoundException, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { MongoIdParam } from '../../core/decorators/mongo-id-param';
import { Validate } from '../../core/decorators/validate';
import { CatDto } from '../dtos/cat.dto';
import { CreateCatDto } from '../dtos/create-cat.dto';
import { CatQuery } from '../queries/cat.query';
import { CatDocument } from '../schemas/cat.schema';
import { CatsService } from '../services/cats.service';

@Controller()
@ApiSelfTag()
export class CatsController {

  constructor(
    private readonly catsService: CatsService,
  ) { }

  @Get()
  @Validate()
  @ApiQueryResultResponse(CatDto, {
    map: CatDto.default,
    response: {
      description: 'Paginated, sorted and filtered list of cats'
    }
  })
  async query(
    @Query() query: CatQuery,
  ): Promise<QueryResult<CatDocument>> {
    return this.catsService.query(query);
  }

  @Post()
  @Validate()
  @ApiCreatedResponse({ description: 'Cat was created, returns the DTO', type: CatDto })
  async create(@Body() dto: CreateCatDto): Promise<CatDto> {
    const catDoc = await this.catsService.create(dto);
    return CatDto.default(catDoc);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Cat data', type: CatDto })
  @ApiNotFoundResponse({ description: 'Could not find cat with given ID' })
  async getById(@MongoIdParam('id') id: string) {
    const user = await this.catsService.findById(id);
    if (!user) {
      throw new NotFoundException();
    }
    return CatDto.default(user);
  }

  @Delete(':id')
  @ApiNoContentResponse({ description: 'Cat was deleted' })
  @ApiNotFoundResponse({ description: 'Could not find cat with given ID' })
  async deleteById(@MongoIdParam('id') id: string) {
    const cat = await this.catsService.findById(id);
    if (!cat) {
      throw new NotFoundException();
    }
    await cat.deleteOne();
  }

}

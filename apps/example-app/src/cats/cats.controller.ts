import { Public } from '@jchpro/nest-common/auth';
import { ApiQueryResultResponse, ApiSelfTag } from '@jchpro/nest-common/openapi';
import { ThrottleContent, ThrottleUserWrite } from '@jchpro/nest-common/throttling';
import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiSecurity } from '@nestjs/swagger';
import { Permission, RequireAuthorization } from '../auth/permission.js';
import { MongoIdParam } from '../shared/app-schema.js';
import { toDto } from '../shared/to-dto.js';
import { Validate } from '../shared/validate.js';
import { CatDto, CatsQuery, CreateCatDto, UpdateCatDto } from './cat.dto.js';
import { CatsService } from './cats.service.js';

@Controller('cats')
@ApiSelfTag()
@Validate()
export class CatsController {
  constructor(private readonly cats: CatsService) {}

  @Get()
  @Public()
  @ApiQueryResultResponse(CatDto, { map: (cat) => toDto(CatDto, cat) })
  @ThrottleContent()
  list(@Query() query: CatsQuery) {
    return this.cats.list(query);
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ type: CatDto })
  @ApiNotFoundResponse()
  @ThrottleContent()
  async get(@MongoIdParam('id') id: string) {
    return toDto(CatDto, await this.cats.get(id));
  }

  @Post()
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.CatsWrite)
  @ApiCreatedResponse({ type: CatDto })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  @ThrottleUserWrite()
  async create(@Body() dto: CreateCatDto) {
    return toDto(CatDto, await this.cats.create(dto));
  }

  @Patch(':id')
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.CatsWrite)
  @ApiOkResponse({ type: CatDto })
  @ApiNotFoundResponse()
  @ThrottleUserWrite()
  async update(@MongoIdParam('id') id: string, @Body() dto: UpdateCatDto) {
    return toDto(CatDto, await this.cats.update(id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.CatsWrite)
  @ApiNoContentResponse({ description: 'The cat is soft-deleted' })
  @ApiNotFoundResponse()
  @ThrottleUserWrite()
  remove(@MongoIdParam('id') id: string) {
    return this.cats.remove(id);
  }

  @Post(':id/restore')
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.CatsWrite)
  @ApiCreatedResponse({ type: CatDto })
  @ApiNotFoundResponse({ description: 'No such soft-deleted cat' })
  @ThrottleUserWrite()
  async restore(@MongoIdParam('id') id: string) {
    return toDto(CatDto, await this.cats.restore(id));
  }
}

import { Public } from '@jchpro/nest-common/auth';
import { ApiQueryResultResponse, ApiSelfTag, PaginationParams, SortingType } from '@jchpro/nest-common/openapi';
import { ThrottleContent, ThrottleNormal, ThrottleStrict } from '@jchpro/nest-common/throttling';
import { Body, Controller, Delete, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiSecurity,
  IntersectionType,
} from '@nestjs/swagger';
import { Permission, RequireAuthorization } from '../auth/permission.js';
import { CatsService } from '../cats/cats.service.js';
import { MongoIdParam } from '../shared/app-schema.js';
import { toDto } from '../shared/to-dto.js';
import { Validate } from '../shared/validate.js';
import { CreateOwnerDto, OwnerDto, TransferCatsDto, TransferCatsResultDto } from './owner.dto.js';
import { type Owner } from './owner.schema.js';
import { OwnersService } from './owners.service.js';

class OwnersQuery extends IntersectionType(PaginationParams, SortingType<Owner>(['name', 'catsCount', 'createdAt'])) {}

@Controller('owners')
@ApiSelfTag()
@Validate()
export class OwnersController {
  constructor(
    private readonly owners: OwnersService,
    private readonly cats: CatsService,
  ) {}

  @Get()
  @Public()
  @ApiQueryResultResponse(OwnerDto, { map: (owner) => toDto(OwnerDto, owner) })
  @ThrottleContent()
  list(@Query() query: OwnersQuery) {
    return this.owners.list(query);
  }

  @Get(':id')
  @Public()
  @ApiOkResponse({ type: OwnerDto })
  @ApiNotFoundResponse()
  @ThrottleContent()
  async get(@MongoIdParam('id') id: string) {
    return toDto(OwnerDto, await this.owners.get(id));
  }

  @Post()
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.OwnersWrite)
  @ApiCreatedResponse({ type: OwnerDto })
  @ThrottleNormal()
  async create(@Body() dto: CreateOwnerDto) {
    return toDto(OwnerDto, await this.owners.create(dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.OwnersWrite)
  @ApiNoContentResponse()
  @ApiNotFoundResponse()
  @ApiConflictResponse({ description: 'The owner is still referenced by cats' })
  @ThrottleNormal()
  remove(@MongoIdParam('id') id: string) {
    return this.owners.remove(id);
  }

  @Post(':id/transfer-cats')
  @ApiSecurity('demo-user')
  @RequireAuthorization(Permission.OwnersWrite, Permission.CatsWrite)
  @ApiCreatedResponse({ type: TransferCatsResultDto })
  @ApiNotFoundResponse({ description: 'Owner not found' })
  @ThrottleStrict()
  async transferCats(@MongoIdParam('id') id: string, @Body() dto: TransferCatsDto): Promise<TransferCatsResultDto> {
    return { moved: await this.cats.transferAll(id, dto.toOwnerId) };
  }
}

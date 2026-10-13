import { type QueryData, type QueryResult } from '@jchpro/nest-common';
import { QueryService, ReferencingDocsLookupService, SchemaReferencesService } from '@jchpro/nest-mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { type CreateOwnerDto } from './owner.dto.js';
import { Owner, type OwnerDocument } from './owner.schema.js';

@Injectable()
export class OwnersService {
  constructor(
    @InjectModel(Owner.name) private readonly ownerModel: Model<OwnerDocument>,
    private readonly queryService: QueryService,
    private readonly schemaRefs: SchemaReferencesService,
    private readonly refsLookup: ReferencingDocsLookupService,
  ) {}

  list(query: QueryData): Promise<QueryResult<OwnerDocument>> {
    return this.queryService.execute<OwnerDocument>(this.ownerModel, query);
  }

  async get(id: string): Promise<OwnerDocument> {
    const owner = await this.ownerModel.findById(id);
    if (!owner) {
      throw new NotFoundException(`Owner ${id} not found`);
    }
    return owner;
  }

  create(dto: CreateOwnerDto): Promise<OwnerDocument> {
    return this.ownerModel.create({ name: dto.name });
  }

  /** Refused with `409 Conflict` while any cat (soft-deleted ones included) still references the owner. */
  async remove(id: string): Promise<void> {
    const owner = await this.get(id);
    // Which schemas reference `Owner` was collected from the models' `ref`s by `SingleConnectionSchemaRefsModule`
    await this.refsLookup.assertUnreferenced(owner._id, this.schemaRefs.getSchemasReferencing(Owner.name));
    await owner.deleteOne();
  }
}

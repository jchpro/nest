import { type QueryResult } from '@jchpro/nest-common';
import { QueryService, type SoftDeleteModel, TransactionalService } from '@jchpro/nest-mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { type Connection, type Model } from 'mongoose';
import { Owner, type OwnerDocument } from '../owners/owner.schema.js';
import { type CatsQuery, type CreateCatDto, type UpdateCatDto } from './cat.dto.js';
import { Cat, type CatDocument } from './cat.schema.js';

/**
 * A cat and the `catsCount` of its owner change together, hence the transactions
 * (every query in them gets the `session`).
 */
@Injectable()
export class CatsService extends TransactionalService {
  constructor(
    @InjectConnection() connection: Connection,
    @InjectModel(Cat.name) private readonly catModel: SoftDeleteModel<CatDocument>,
    @InjectModel(Owner.name) private readonly ownerModel: Model<OwnerDocument>,
    private readonly queryService: QueryService,
  ) {
    super(connection);
  }

  list(query: CatsQuery): Promise<QueryResult<CatDocument>> {
    // Pagination, sorting and filters come from the query DTO, `onlyDeleted` is a soft delete plugin option
    return this.queryService.execute(this.catModel, query, query, undefined, query.deleted ? { onlyDeleted: true } : undefined);
  }

  async get(id: string): Promise<CatDocument> {
    const cat = await this.catModel.findById(id);
    if (!cat) {
      throw new NotFoundException(`Cat ${id} not found`);
    }
    return cat;
  }

  create(dto: CreateCatDto): Promise<CatDocument> {
    return this.transactional(async (session) => {
      const owner = await this.ownerModel.findByIdAndUpdate(dto.ownerId, { $inc: { catsCount: 1 } }, { session });
      if (!owner) {
        throw new NotFoundException(`Owner ${dto.ownerId} not found`);
      }
      const [cat] = await this.catModel.create([{ name: dto.name, breed: dto.breed, owner: owner._id }], { session });
      return cat;
    });
  }

  async update(id: string, dto: UpdateCatDto): Promise<CatDocument> {
    const cat = await this.catModel.findByIdAndUpdate(id, dto, { new: true });
    if (!cat) {
      throw new NotFoundException(`Cat ${id} not found`);
    }
    return cat;
  }

  /** Soft delete: the cat stays in the database with `deletedAt` set, and still counts as a reference to its owner. */
  remove(id: string): Promise<void> {
    return this.transactional(async (session) => {
      const cat = await this.catModel.findById(id).session(session);
      if (!cat) {
        throw new NotFoundException(`Cat ${id} not found`);
      }
      await cat.softDelete({ session });
      await this.ownerModel.updateOne({ _id: cat.owner }, { $inc: { catsCount: -1 } }, { session });
    });
  }

  restore(id: string): Promise<CatDocument> {
    return this.transactional(async (session) => {
      // Soft-deleted documents are invisible unless `onlyDeleted` / `withDeleted` is passed
      const cat = await this.catModel.findOne({ _id: id }, null, { onlyDeleted: true, session });
      if (!cat) {
        throw new NotFoundException(`Deleted cat ${id} not found`);
      }
      await this.catModel.restoreOne({ _id: cat._id }, { session });
      await this.ownerModel.updateOne({ _id: cat.owner }, { $inc: { catsCount: 1 } }, { session });
      return this.catModel.findById(cat._id).session(session).orFail();
    });
  }

  /** Moves all live cats from one owner to another. Soft-deleted cats stay where they were. */
  transferAll(fromOwnerId: string, toOwnerId: string): Promise<number> {
    return this.transactional(async (session) => {
      const [from, to] = await Promise.all([
        this.ownerModel.exists({ _id: fromOwnerId }).session(session),
        this.ownerModel.exists({ _id: toOwnerId }).session(session),
      ]);
      if (!from || !to) {
        throw new NotFoundException(`Owner ${!from ? fromOwnerId : toOwnerId} not found`);
      }
      const { modifiedCount } = await this.catModel.updateMany({ owner: fromOwnerId }, { owner: toOwnerId }, { session });
      await this.ownerModel.updateOne({ _id: fromOwnerId }, { $inc: { catsCount: -modifiedCount } }, { session });
      await this.ownerModel.updateOne({ _id: toOwnerId }, { $inc: { catsCount: modifiedCount } }, { session });
      return modifiedCount;
    });
  }
}

import type { Aggregate, ClientSession, FilterQuery, Model, Query, Schema, UpdateResult } from 'mongoose';

declare module 'mongoose' {
  interface QueryOptions<DocType = unknown> {
    /**
     * Soft-delete plugin: include soft-deleted documents alongside live ones.
     */
    withDeleted?: boolean;

    /**
     * Soft-delete plugin: match only soft-deleted documents.
     */
    onlyDeleted?: boolean;
  }

  interface AggregateOptions {
    /**
     * Soft-delete plugin: include soft-deleted documents alongside live ones.
     */
    withDeleted?: boolean;

    /**
     * Soft-delete plugin: match only soft-deleted documents.
     */
    onlyDeleted?: boolean;
  }
}

export interface SoftDeleteOptions {

  /**
   * When set, soft-deleted documents are physically removed by MongoDB (a TTL index on `deletedAt`) this many
   * days after they were soft-deleted. Documents which were never soft-deleted have no `deletedAt` and never expire.
   * The TTL is fixed at index creation, changing it later requires `collMod` on the collection.
   */
  purgeAfterDays?: number;
}

export interface SoftDeleteWriteOptions {
  session?: ClientSession;

  /**
   * When soft-deleting: the timestamp to set, defaults to now. Pass the same value to related schemas so they can be restored together.
   * When restoring: only documents soft-deleted at exactly this timestamp are restored.
   */
  deletedAt?: Date;
}

/**
 * Instance methods added by {@link softDeletePlugin}.
 */
export interface SoftDeleteMethods {
  softDelete(options?: SoftDeleteWriteOptions): Promise<this>;
  restore(): Promise<this>;
}

/**
 * Statics added by {@link softDeletePlugin}.
 */
export interface SoftDeleteModel<TDoc> extends Model<TDoc> {
  softDeleteOne(filter: FilterQuery<TDoc>, options?: SoftDeleteWriteOptions): Promise<UpdateResult>;
  softDeleteMany(filter: FilterQuery<TDoc>, options?: SoftDeleteWriteOptions): Promise<UpdateResult>;
  restoreOne(filter: FilterQuery<TDoc>, options?: SoftDeleteWriteOptions): Promise<UpdateResult>;
  restoreMany(filter: FilterQuery<TDoc>, options?: SoftDeleteWriteOptions): Promise<UpdateResult>;
}

const DELETED_AT = 'deletedAt';

const FILTERED_QUERY_OPERATIONS = [
  'count',
  'countDocuments',
  'distinct',
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'updateOne',
  'updateMany'
] as const;

/**
 * Opt-in soft deletes for a schema: `schema.plugin(softDeletePlugin)`.
 *
 * Adds an optional `deletedAt` date (absent means live) and hides soft-deleted documents from `find*`, `count*`,
 * `distinct`, `update*`, `replaceOne` and `aggregate`. Pass `{ withDeleted: true }` or `{ onlyDeleted: true }` as
 * query (or aggregate) options to opt out. A query whose filter already mentions `deletedAt` is left untouched.
 *
 * `deleteOne`, `deleteMany` and `findOneAndDelete` are deliberately not touched: they stay physical and act as "purge".
 * Not covered by the hooks: `bulkWrite`, `insertMany`, `$lookup` stages (other collections) and `populate`
 * (which does use `find`, so a soft-deleted reference populates as `null`).
 */
export function softDeletePlugin(schema: Schema, options: SoftDeleteOptions = {}): void {
  schema.add({
    [DELETED_AT]: { type: Date, required: false }
  });

  if (options.purgeAfterDays) {
    schema.index({ [DELETED_AT]: 1 }, { expireAfterSeconds: Math.round(options.purgeAfterDays * 24 * 60 * 60) });
  }

  schema.pre(FILTERED_QUERY_OPERATIONS as unknown as ['find'], function (this: Query<unknown, unknown>) {
    const queryOptions = this.getOptions();
    if (queryOptions.withDeleted || DELETED_AT in this.getFilter()) {
      return;
    }
    this.where({ [DELETED_AT]: deletedAtCondition(queryOptions.onlyDeleted) });
  });

  schema.pre('aggregate', function (this: Aggregate<unknown>) {
    const aggregateOptions = this.options;
    if (aggregateOptions.withDeleted) {
      return;
    }
    this.pipeline().unshift({ $match: { [DELETED_AT]: deletedAtCondition(aggregateOptions.onlyDeleted) } });
  });

  schema.methods.softDelete = async function (this: any, writeOptions?: SoftDeleteWriteOptions) {
    this.set(DELETED_AT, writeOptions?.deletedAt ?? new Date());
    return this.save({ session: writeOptions?.session });
  };

  schema.methods.restore = async function (this: any) {
    this.set(DELETED_AT, undefined);
    return this.save();
  };

  schema.statics.softDeleteOne = function (this: Model<any>, filter, writeOptions?: SoftDeleteWriteOptions) {
    return this.updateOne(filter, { $set: { [DELETED_AT]: writeOptions?.deletedAt ?? new Date() } }, { session: writeOptions?.session }).exec();
  };

  schema.statics.softDeleteMany = function (this: Model<any>, filter, writeOptions?: SoftDeleteWriteOptions) {
    return this.updateMany(filter, { $set: { [DELETED_AT]: writeOptions?.deletedAt ?? new Date() } }, { session: writeOptions?.session }).exec();
  };

  schema.statics.restoreOne = function (this: Model<any>, filter, writeOptions?: SoftDeleteWriteOptions) {
    return this.updateOne(restoreFilter(filter, writeOptions), { $unset: { [DELETED_AT]: 1 } }, { session: writeOptions?.session }).setOptions({ onlyDeleted: true }).exec();
  };

  schema.statics.restoreMany = function (this: Model<any>, filter, writeOptions?: SoftDeleteWriteOptions) {
    return this.updateMany(restoreFilter(filter, writeOptions), { $unset: { [DELETED_AT]: 1 } }, { session: writeOptions?.session }).setOptions({ onlyDeleted: true }).exec();
  };
}

function deletedAtCondition(onlyDeleted?: boolean) {
  // `null` matches both a missing field and an explicit null.
  return onlyDeleted ? { $ne: null } : null;
}

function restoreFilter(filter: FilterQuery<any>, writeOptions?: SoftDeleteWriteOptions): FilterQuery<any> {
  return writeOptions?.deletedAt ? { ...filter, [DELETED_AT]: writeOptions.deletedAt } : filter;
}

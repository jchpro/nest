import { AppSchemaFactory, MongoIdParamFactory, TransformMongoIdFactory } from '@jchpro/nest-mongoose';

// The factories let an app set its defaults once and then use the decorators everywhere

/** Schemas of this app: no `__v`, `createdAt` and `updatedAt` maintained by Mongoose. */
export const AppSchema = AppSchemaFactory({ versionKey: false, timestamps: true });

/** Route parameter which must be a Mongo ID. */
export const MongoIdParam = MongoIdParamFactory();

/** Serializes an `ObjectId` (or a populated document's ID) as a string when a document is transformed to a DTO. */
export const TransformMongoId = TransformMongoIdFactory();

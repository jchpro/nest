import { ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, ObjectId } from "mongoose";
import { SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS } from '../consts/injection-tokens';
import { SingleConnectionSchemaRefsOptions } from '../single-connection-schema-refs.module';
import { SchemaRefInfo } from '../utilities/schema-refs';

/**
 * Helper service for finding references between schemas, in a single connection environment.
 * Provided by {@link SingleConnectionSchemaRefsModule}.
 */
@Injectable()
export class ReferencingDocsLookupService {

  private readonly idField: string;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(SINGLE_CONNECTION_SCHEMA_REFS_OPTIONS) @Optional() private readonly options?: SingleConnectionSchemaRefsOptions
  ) {
    this.idField = options?.idField ?? '_id';
  }

  /**
   * Throws an error if any references of the `referencedId` are found in any models mentioned in `externalRefs`.
   * Either return value of `errorFactory`, factory passed during module configuration, or default `ConflictException` will be thrown if any references are found.
   */
  async assertUnreferenced(referencedId: ObjectId,
                           externalRefs: SchemaRefInfo[],
                           errorFactory?: (id: string, infos: ReferencingDocInfo[]) => any): Promise<void> {
    const infos = await this.find(referencedId, externalRefs);
    if (infos.length) {
      throw errorFactory?.(referencedId.toString(), infos) ?? this.throwDefaultException(referencedId.toString(), infos);
    }
  }

  /**
   * Find any references of the `referencedId` found in any models mentioned in `externalRefs`.
   */
  async find(referencedId: ObjectId,
             externalRefs: SchemaRefInfo[]): Promise<ReferencingDocInfo[]> {
    const models = externalRefs
       .map(info => ({
         model: this.connection.model(info.schema),
         info
       }));
    const infos: ReferencingDocInfo[] = [];
    for (const { model, info } of models) {
      const docs = await model
        .find({ [info.path]: referencedId })
        .select(this.idField)
        .lean()
        .exec();
      if (!docs.length) {
        continue;
      }
      infos.push({
        name: info.schema,
        count: docs.length,
        ids: docs.map(doc => (doc[this.idField] as any).toString())
      });
    }
    return infos;
  }

  private throwDefaultException(id: string, infos: ReferencingDocInfo[]): Error {
    const factory = this.options?.unrefAssertionErrorFactory;
    if (factory) {
      return factory(id, infos);
    }
    return new ConflictException(`Object with ID ${id} is still referenced by: ${infos.map(info => `[${info.name}]: ${info.ids.join(', ')}`).join('; ')}`);
  }

}

/**
 * Information about referencing documents.
 */
export interface ReferencingDocInfo {

  /**
   * Name of the schema.
   */
  name: string;

  /**
   * Number of referencing documents.
   */
  count: number;

  /**
   * IDs of referencing documents.
   */
  ids: string[];
}

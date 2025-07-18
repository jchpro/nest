import { ArgumentMetadata, NotFoundException, PipeTransform } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

/**
 * Returns pipe which will resolve `Document` from incoming value using `Model`.
 * Thrown error can be customized.
 */
export function ResolveDocumentPipeFactory<TDoc extends Document, TVal = string>(init: {
  modelName: string;
  connectionName?: string;
  resolveFn: (model: Model<TDoc>, value: TVal) => Promise<TDoc | null>;
  throwNotFound?: boolean | ((value: TVal) => any);
}) {
  class ResolveDocumentPipe implements PipeTransform<TVal, Promise<TDoc | null>> {

    constructor(
      @InjectModel(init.modelName, init.connectionName) public readonly model: Model<TDoc>
    ) {
    }

    async transform(value: TVal, metadata: ArgumentMetadata): Promise<TDoc | null> {
      const doc = await init.resolveFn(this.model, value);
      if (doc) {
        return doc;
      }
      const throwPolicy = init.throwNotFound;
      if (!throwPolicy) {
        return null;
      }
      if (typeof throwPolicy === 'function') {
        throw throwPolicy(value);
      }
      throw new NotFoundException();
    }
  }

  return ResolveDocumentPipe;
}


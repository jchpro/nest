import { type ClassConstructor, plainToInstance } from 'class-transformer';

/** Turns a Mongoose document into a response DTO, exposing only the properties marked with `@Expose()`. */
export function toDto<T>(dtoClass: ClassConstructor<T>, doc: { toObject(): object }): T {
  return plainToInstance(dtoClass, doc.toObject(), { excludeExtraneousValues: true });
}

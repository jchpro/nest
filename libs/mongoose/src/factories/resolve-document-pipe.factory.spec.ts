import { NotFoundException } from '@nestjs/common';
import { ResolveDocumentPipeFactory } from './resolve-document-pipe.factory';

describe('ResolveDocumentPipeFactory', () => {

  it('should return properly configured class which passes Model to the resolve function', async () => {
    // Given
    const pipeClass = ResolveDocumentPipeFactory({
      modelName: 'Entity',
      resolveFn: (model, id) => model.findById(id)
    });
    const mockModel = {
      findById: (id: string) => Promise.resolve({ iam: 'entity' })
    };
    const findSpy = jest.spyOn(mockModel, 'findById');
    const pipe = new pipeClass(mockModel as any);

    // When
    const result = await pipe.transform('abc', {} as any);

    // Then
    expect(result).toEqual({ iam: 'entity' });
    expect(findSpy).toHaveBeenCalledWith('abc');
  });

  it('should return null for not resolved entity if error throwing was not configured', async () => {
    // Given
    const pipeClass = ResolveDocumentPipeFactory({
      modelName: 'Entity',
      resolveFn: (model, id) => model.findById(id)
    });
    const mockModel = {
      findById: (id: string) => Promise.resolve(null)
    };
    const pipe = new pipeClass(mockModel as any);

    // When
    const result = await pipe.transform('abc', {} as any);

    // Then
    expect(result).toEqual(null);
  });

  it('should return throw not found exception for not resolved entity if error throwing was configured', async () => {
    // Given
    const pipeClass = ResolveDocumentPipeFactory({
      modelName: 'Entity',
      resolveFn: (model, id) => model.findById(id),
      throwNotFound: true
    });
    const mockModel = {
      findById: (id: string) => Promise.resolve(null)
    };
    const pipe = new pipeClass(mockModel as any);

    // When
    let caught: any;
    try {
      await pipe.transform('abc', {} as any);
    } catch (e) {
      caught = e;
    }

    // Then
    expect(caught).toBeInstanceOf(NotFoundException);
  });
});

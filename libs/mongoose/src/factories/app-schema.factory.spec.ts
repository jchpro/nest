import { AppSchemaFactory } from '@jchpro/nest-mongoose';

jest.mock('@nestjs/mongoose', () => {
  return {
    ...jest.requireActual('@nestjs/mongoose')
  };
});

describe('AppSchemaFactory', () => {
  let mockMongoose: any;

  beforeEach(() => {
    mockMongoose = jest.requireMock('@nestjs/mongoose');
  });

  it ('should pass along Schema options to internal decorator', () => {
    // Given
    const schemaSpy = jest.spyOn(mockMongoose, 'Schema');
    const AppSchema = AppSchemaFactory({
      timestamps: false
    });

    // When
    AppSchema();

    // Then
    expect(schemaSpy).toHaveBeenCalledWith({
      timestamps: false
    });
    
    // And when
    AppSchema({ timestamps: true });


    // Then
    expect(schemaSpy).toHaveBeenCalledWith({
      timestamps: true
    });
  });

});

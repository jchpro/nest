import { AppSchemaFactory } from '../index.js';
import * as MongooseModule from '@nestjs/mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nestjs/mongoose', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof MongooseModule>()),
  };
});

describe('AppSchemaFactory', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass along Schema options to internal decorator', () => {
    // Given
    const schemaSpy = vi.spyOn(MongooseModule, 'Schema');
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

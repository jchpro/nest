import { describe, expect, it } from 'vitest';
import { METADATA_KEY } from '../consts/metadata-key.js';
import { EnvProperty } from './env.property.js';

// `EnvProperty` accumulates onto the same metadata array across decorators on a class (it reads
// via `Reflect.getMetadata` and writes back via `Reflect.defineMetadata` with the same array
// reference), so asserting individual `defineMetadata` call arguments is misleading — every
// recorded call ends up pointing at the same, later-mutated array. Asserting the final,
// observable `Reflect.getMetadata` result instead is both simpler and matches how
// `ConfigModule` actually reads this metadata.

describe('EnvProperty', () => {

  it('should record metadata for each decorated property, accumulated in declaration order', () => {
    // When
    class MockConfig {
      @EnvProperty('ENV_VAR')
      myVar!: string;

      @EnvProperty()
      OTHER_VAR!: string;
    }

    // Then
    expect(Reflect.getMetadata(METADATA_KEY, MockConfig)).toEqual([
      { propertyKey: 'myVar', variableName: 'ENV_VAR' },
      { propertyKey: 'OTHER_VAR', variableName: 'OTHER_VAR' },
    ]);
  });

  it('should keep metadata separate per class', () => {
    // When
    class ConfigA {
      @EnvProperty()
      A!: string;
    }

    class ConfigB {
      @EnvProperty()
      B!: string;
    }

    // Then
    expect(Reflect.getMetadata(METADATA_KEY, ConfigA)).toEqual([
      { propertyKey: 'A', variableName: 'A' },
    ]);
    expect(Reflect.getMetadata(METADATA_KEY, ConfigB)).toEqual([
      { propertyKey: 'B', variableName: 'B' },
    ]);
  });
});

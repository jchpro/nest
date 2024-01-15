import { EnvProperty } from './env.property';

const METADATA_KEY = 'ENV_PROPERTIES_METADATA';

describe('EnvProperty', () => {
  beforeAll(() => {
    global.Reflect = {
      getMetadata: () => {},
      defineMetadata: () => {},
    } as any;
  });

  it('should apply metadata to class', () => {
    // Given
    const defineMetadataSpy = jest.spyOn(Reflect, 'defineMetadata');
    const testRunner = () => {
      class MockConfig {
        @EnvProperty('ENV_VAR')
        myVar: string;

        @EnvProperty()
        OTHER_VAR: string;
      }

      return MockConfig;
    };

    // When
    const klass = testRunner();

    // Then
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      METADATA_KEY,
      [{ propertyKey: 'myVar', variableName: 'ENV_VAR' }],
      klass,
    );

    // And
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      METADATA_KEY,
      [{ propertyKey: 'OTHER_VAR', variableName: 'OTHER_VAR' }],
      klass,
    );
  });

  it('should append metadata to already existing array', () => {
    // Given
    const getMetadataSpy = jest
      .spyOn(Reflect, 'getMetadata')
      .mockReturnValue([{ propertyKey: 'varLife', variableName: 'IS_HARD' }]);
    const defineMetadataSpy = jest.spyOn(Reflect, 'defineMetadata');
    const testRunner = () => {
      class MockConfig {
        @EnvProperty()
        SAME_BRO: string;
      }

      return MockConfig;
    };

    // When
    const klass = testRunner();

    // Then
    expect(getMetadataSpy).toHaveBeenCalled();
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      METADATA_KEY,
      [
        { propertyKey: 'varLife', variableName: 'IS_HARD' },
        { propertyKey: 'SAME_BRO', variableName: 'SAME_BRO' },
      ],
      klass,
    );
  });
});

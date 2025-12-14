import { PolymorphismApiHelper } from './polymorphism-api.helper';

let apiPropertyArgs: any[] = [];

jest.mock('../internal/swagger', () => {
  return {
    getSchemaPath: (model: any) => `#/components/schemas/${model?.name ?? 'Unknown'}`,
    ApiProperty: (...args: any[]) => {
      apiPropertyArgs.push(args);
      return () => undefined;
    },
  };
});

describe('PolymorphismApiHelper', () => {
  beforeEach(() => {
    apiPropertyArgs = [];
    jest.clearAllMocks();
  });

  it('should call ApiProperty decorator with properly mapped configuration (non-array) and merge extraOptions', () => {
    class Base {}
    class Cat extends Base {}
    class Dog extends Base {}

    const helper = new PolymorphismApiHelper<string>('kind', Base as any);
    helper.register('cat', Cat as any);
    helper.register('dog', Dog as any);

    const decorator = helper.ApiProperty(
      { required: false },
      {
        description: 'Some polymorphic field',
        nullable: true,
      } as any
    );

    expect(typeof decorator).toBe('function');
    expect(apiPropertyArgs).toHaveLength(1);

    const [options] = apiPropertyArgs[0];
    expect(options).toEqual({
      required: false,
      oneOf: [
        { $ref: '#/components/schemas/Cat' },
        { $ref: '#/components/schemas/Dog' },
      ],
      discriminator: {
        propertyName: 'kind',
        mapping: {
          cat: '#/components/schemas/Cat',
          dog: '#/components/schemas/Dog',
        },
      },
      description: 'Some polymorphic field',
      nullable: true,
    });
  });

  it('should map configuration for array schema when isArray=true and merge extraOptions', () => {
    class Base {}
    class Cat extends Base {}
    class Dog extends Base {}

    const helper = new PolymorphismApiHelper<string>('kind', Base as any);
    helper.register('cat', Cat as any);
    helper.register('dog', Dog as any);

    const decorator = helper.ApiProperty(
      { isArray: true, required: true },
      {
        description: 'Array of polymorphic models',
        minItems: 1,
      } as any
    );

    expect(typeof decorator).toBe('function');
    expect(apiPropertyArgs).toHaveLength(1);

    const [options] = apiPropertyArgs[0];
    expect(options).toEqual({
      type: 'array',
      required: true,
      items: {
        oneOf: [
          { $ref: '#/components/schemas/Cat' },
          { $ref: '#/components/schemas/Dog' },
        ],
      },
      discriminator: {
        propertyName: 'kind',
        mapping: {
          cat: '#/components/schemas/Cat',
          dog: '#/components/schemas/Dog',
        },
      },
      description: 'Array of polymorphic models',
      minItems: 1,
    });
  });
});

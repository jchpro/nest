import { PolymorphicSchema } from './polymorphic.schema';
import { SchemaFactory } from '@nestjs/mongoose';

jest.mock('mongoose', () => {
  // We don't want real mongoose in unit tests; PolymorphicSchema only uses the type.
  return {
    Schema: class MockSchema {},
  };
});

jest.mock('@nestjs/mongoose', () => {
  return {
    SchemaFactory: {
      createForClass: jest.fn(),
    },
  };
});

describe('PolymorphicSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create base schema using SchemaFactory.createForClass(base) and expose it as `schema`', () => {
    class Base {}

    const baseSchema = { discriminator: jest.fn() };
    (SchemaFactory.createForClass as jest.Mock).mockReturnValueOnce(baseSchema);

    const helper = new PolymorphicSchema<string>('kind', Base as any);

    expect(SchemaFactory.createForClass).toHaveBeenCalledTimes(1);
    expect(SchemaFactory.createForClass).toHaveBeenCalledWith(Base);
    expect(helper.schema).toBe(baseSchema as any);
  });

  it('should create sub schema and register discriminator on base schema with proper objects', () => {
    class Base {}
    class Sub extends Base {}

    const baseSchema = { discriminator: jest.fn() };
    const subSchema = { some: 'sub-schema' };

    (SchemaFactory.createForClass as jest.Mock)
      .mockReturnValueOnce(baseSchema) // constructor: base
      .mockReturnValueOnce(subSchema); // register: sub

    const helper = new PolymorphicSchema<string>('kind', Base as any);
    helper.register('sub', Sub as any);

    expect(SchemaFactory.createForClass).toHaveBeenCalledTimes(2);
    expect(SchemaFactory.createForClass).toHaveBeenNthCalledWith(1, Base);
    expect(SchemaFactory.createForClass).toHaveBeenNthCalledWith(2, Sub);

    expect(baseSchema.discriminator).toHaveBeenCalledTimes(1);
    expect(baseSchema.discriminator).toHaveBeenCalledWith('sub', subSchema);
  });

  it('should not call discriminator when registering the same discriminator value twice', () => {
    class Base {}
    class Sub1 extends Base {}
    class Sub2 extends Base {}

    const baseSchema = { discriminator: jest.fn() };
    const subSchema1 = { name: 'sub1-schema' };
    const subSchema2 = { name: 'sub2-schema' };

    (SchemaFactory.createForClass as jest.Mock)
      .mockReturnValueOnce(baseSchema) // constructor: base
      .mockReturnValueOnce(subSchema1) // first register
      .mockReturnValueOnce(subSchema2); // second register (should not be used)

    const helper = new PolymorphicSchema<string>('kind', Base as any);

    helper.register('dup', Sub1 as any);
    helper.register('dup', Sub2 as any);

    // Base schema discriminator should only be called once (first registration wins)
    expect(baseSchema.discriminator).toHaveBeenCalledTimes(1);
    expect(baseSchema.discriminator).toHaveBeenCalledWith('dup', subSchema1);

    // createForClass should be called for base + first subtype + second subtype
    // (PolymorphicSchema calls createForClass(subType) only if base class accepted it;
    // the second registration should be rejected by base class and thus not call createForClass)
    expect(SchemaFactory.createForClass).toHaveBeenCalledTimes(2);
    expect(SchemaFactory.createForClass).toHaveBeenNthCalledWith(1, Base);
    expect(SchemaFactory.createForClass).toHaveBeenNthCalledWith(2, Sub1);
  });
});

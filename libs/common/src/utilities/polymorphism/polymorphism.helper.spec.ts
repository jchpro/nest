import { PolymorphismHelper } from './polymorphism.helper';

let typeDecoratorArgs: any[] | undefined;

jest.mock('class-transformer', () => {
  return {
    Type: (...args: any[]) => {
      typeDecoratorArgs = args;
      // Return a decorator function (what `Type` normally returns)
      return () => undefined;
    },
  };
});

describe('PolymorphismHelper', () => {
  beforeEach(() => {
    typeDecoratorArgs = undefined;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register subtypes properly', () => {
      class Base {}
      class SubA extends Base {}
      class SubB extends Base {}

      const helper = new PolymorphismHelper<string>('kind', Base as any);

      helper.register('a', SubA as any);
      helper.register('b', SubB as any);

      // Accessing protected member for test verification
      const map = (helper as any).map as Map<string, any>;
      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(2);
      expect(map.get('a')).toBe(SubA);
      expect(map.get('b')).toBe(SubB);
    });

    it('should warn and skip when trying to register the same discriminator value twice', () => {
      class Base {}
      class SubA extends Base {}
      class SubA2 extends Base {}

      const helper = new PolymorphismHelper<string>('kind', Base as any);

      const warnSpy = jest
        .spyOn((helper as any).logger, 'warn')
        .mockImplementation(() => undefined);

      helper.register('a', SubA as any);
      helper.register('a', SubA2 as any);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        `Sub type of ${Base.name} already registered for value "a", skipping`,
      );

      const map = (helper as any).map as Map<string, any>;
      expect(map.size).toBe(1);
      expect(map.get('a')).toBe(SubA); // should not be overwritten
    });
  });

  describe('Type', () => {
    it('should call underlying Type decorator with proper options (default keepDiscriminatorProperty=true)', () => {
      class Base {}
      class SubA extends Base {}
      class SubB extends Base {}

      const helper = new PolymorphismHelper<string>('kind', Base as any);
      helper.register('a', SubA as any);
      helper.register('b', SubB as any);

      const decorator = helper.Type();
      expect(typeof decorator).toBe('function');

      expect(typeDecoratorArgs).toBeTruthy();
      expect(typeDecoratorArgs!.length).toBe(2);

      const [typeFn, options] = typeDecoratorArgs!;

      // Verify the type function returns base class
      expect(typeof typeFn).toBe('function');
      expect(typeFn()).toBe(Base);

      // Verify options passed to class-transformer Type
      expect(options).toEqual({
        discriminator: {
          property: 'kind',
          subTypes: [
            { value: SubA, name: 'a' },
            { value: SubB, name: 'b' },
          ],
        },
        keepDiscriminatorProperty: true,
      });
    });

    it('should pass keepDiscriminatorProperty=false when provided', () => {
      class Base {}
      class SubA extends Base {}

      const helper = new PolymorphismHelper<string>('kind', Base as any);
      helper.register('a', SubA as any);

      helper.Type({ keepDiscriminatorProperty: false });

      const [, options] = typeDecoratorArgs!;
      expect(options.keepDiscriminatorProperty).toBe(false);
      expect(options.discriminator).toEqual({
        property: 'kind',
        subTypes: [{ value: SubA, name: 'a' }],
      });
    });
  });
});

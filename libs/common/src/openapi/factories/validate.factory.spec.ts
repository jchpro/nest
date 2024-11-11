import { ValidateFactory } from '@jchpro/nest-common/openapi';

let usePipesArgs: any[] = [];

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    UsePipes: (...args: any[]) => {
      usePipesArgs = args;
    },
    ValidationPipe: class {
      constructor(
        readonly arg: any
      ) {
      }
    }
  };
});

describe('ValidateFactory', () => {
  let mockSwagger: any;
  let mockCommon: any;

  beforeEach(() => {
    usePipesArgs = [];
    mockSwagger = jest.requireActual('../internal/swagger');
    mockCommon = jest.requireMock('@nestjs/common');
  });

  it('should pass along ApiBadRequestResponse option to internal decorator', () => {
    // Give
    const badReqResSpy = jest.spyOn(mockSwagger, 'ApiBadRequestResponse');
    const Validate = ValidateFactory(
      { description: 'test' },
      { }
    );

    // When
    Validate();

    // Then
    expect(badReqResSpy).toHaveBeenCalledWith({ description: 'test' });
  });


  it('should pass along ValidationPipe option to internal decorator', () => {
    // Give
    const usePipesSpy = jest.spyOn(mockCommon, 'UsePipes');
    const Validate = ValidateFactory(
      { },
      { always: true }
    );

    // When
    Validate();

    // Then
    expect(usePipesSpy).toHaveBeenCalledTimes(1);
    expect(usePipesArgs[0]).toBeTruthy();
    expect(usePipesArgs[0].arg).toEqual({ always: true });

    // And when
    Validate({ always: false });

    // Then
    expect(usePipesSpy).toHaveBeenCalledTimes(2);
    expect(usePipesArgs[0]).toBeTruthy();
    expect(usePipesArgs[0].arg).toEqual({ always: false });
  });

});

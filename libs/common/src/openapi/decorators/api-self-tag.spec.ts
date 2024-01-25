import { ApiSelfTag } from "./api-self-tag";

let appliedToTarget: any;

jest.mock('../internal/swagger', () => {
  return {
    ApiTags: () => (target: any) => {
      appliedToTarget = target;
    },
  };
});

describe('ApiSelfTag', () => {
  let mockModule: any;

  beforeEach(() => {
    mockModule = jest.requireMock('../internal/swagger');
    appliedToTarget = undefined;
  });

  it('should call `ApiTags` with class name and pass target to proper decorator', () => {
    // Given
    const apiTagsSpy = jest.spyOn(mockModule, 'ApiTags');

    // When
    const classEvaluator = () => {
      @ApiSelfTag()
      class MyController {}
      return MyController;
    };
    const klass = classEvaluator();

    // Then
    expect(klass).toBeTruthy();
    expect(apiTagsSpy).toHaveBeenCalledWith('MyController');
    expect(appliedToTarget).toBe(klass);
  });

  it('should call `ApiTags` with additional tags', () => {
    // Given
    const apiTagsSpy = jest.spyOn(mockModule, 'ApiTags');

    // When
    const classEvaluator = () => {
      @ApiSelfTag('tag_1', 'tag_2', 'tag_3')
      class AwesomeController {}

      return AwesomeController;
    };
    const klass = classEvaluator();

    // Then
    expect(klass).toBeTruthy();
    expect(apiTagsSpy).toHaveBeenCalledWith(
      'AwesomeController',
      'tag_1',
      'tag_2',
      'tag_3',
    );
  });
});

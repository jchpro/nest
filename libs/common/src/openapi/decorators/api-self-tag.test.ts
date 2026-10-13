import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiSelfTag } from './api-self-tag.js';

const state = vi.hoisted(() => ({
  appliedToTarget: undefined as any,
}));

vi.mock('@nestjs/swagger', () => {
  return {
    ApiTags: () => (target: any) => {
      state.appliedToTarget = target;
    },
  };
});

describe('ApiSelfTag', () => {
  let mockModule: any;

  beforeEach(async () => {
    mockModule = await import('@nestjs/swagger');
    state.appliedToTarget = undefined;
  });

  it('should call `ApiTags` with class name and pass target to proper decorator', () => {
    // Given
    const apiTagsSpy = vi.spyOn(mockModule, 'ApiTags');

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
    expect(state.appliedToTarget).toBe(klass);
  });

  it('should call `ApiTags` with additional tags', () => {
    // Given
    const apiTagsSpy = vi.spyOn(mockModule, 'ApiTags');

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

import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicAccessAdvisorService } from './public-access-advisor.service.js';

function getMockContext(): ExecutionContext {
  return {
    getClass<T = any>(): any {
      return {};
    },
    getHandler(): Function {
      return () => {};
    },
  } as ExecutionContext;
}

describe('PublicAccessAdvisorService', () => {
  let service: PublicAccessAdvisorService;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicAccessAdvisorService,
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    service = module.get<PublicAccessAdvisorService>(
      PublicAccessAdvisorService,
    );
  });

  it('should return `true` when reflector matches', () => {
    // Given
    vi
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce(() => true);

    // When
    const result = service.isPublicContext(getMockContext());

    // Then
    expect(result).toBe(true);
  });

  it("should return `false` when reflector doesn't match", () => {
    // Given
    vi
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce(() => false);

    // When
    const result = service.isPublicContext(getMockContext());

    // Then
    expect(result).toBe(false);
  });
});

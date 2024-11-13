import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PublicAccessAdvisorService } from './public-access-advisor.service';

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
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce(() => true);

    // When
    const result = service.isPublicContext(getMockContext());

    // Then
    expect(result).toBe(true);
  });

  it("should return `false` when reflector doesn't match", () => {
    // Given
    const spy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce(() => false);

    // When
    const result = service.isPublicContext(getMockContext());

    // Then
    expect(result).toBe(false);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PasswordUtilityOptions } from '../types/password-utility.options';
import { PasswordUtilityService } from './password-utility.service';

describe('PasswordUtilityService', () => {
  let service: PasswordUtilityService;
  let mockBcrypt: any;


  beforeEach(async () => {
    mockBcrypt = {
      hash: () => {},
      compare: () => {}
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PasswordUtilityService.PASSWORD_UTILITY_OPTIONS,
          useValue: { saltOrRounds: 5 } as PasswordUtilityOptions,
        },
        {
          provide: PasswordUtilityService.BCRYPT,
          useValue: mockBcrypt,
        },
        PasswordUtilityService,
      ],
    }).compile();

    service = module.get(PasswordUtilityService);
  });

  it('should call bcrypt hash passing right arguments and return value', async () => {
    // Given
    const hashSpy = jest.spyOn(mockBcrypt, 'hash')
      .mockReturnValueOnce(Promise.resolve('#'));

    // When
    const hash = await service.hash('pswd');

    // Then
    expect(hashSpy).toHaveBeenCalledWith('pswd', 5);
    expect(hash).toEqual('#');
  });

  it('should call bcrypt compare passing right arguments and return value', async () => {
    // Given
    const compareSpy = jest.spyOn(mockBcrypt, 'compare')
      .mockReturnValueOnce(Promise.resolve(true));

    // When
    const result = await service.compare('pswd', '####');

    // Then
    expect(compareSpy).toHaveBeenCalledWith('pswd', '####');
    expect(result).toEqual(true);
  });


});

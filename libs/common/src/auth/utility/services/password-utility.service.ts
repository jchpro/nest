import { Inject, Injectable } from '@nestjs/common';
import type { compare, hash } from 'bcrypt';
import { PasswordUtilityOptions } from "../types/password-utility.options";

@Injectable()
export class PasswordUtilityService {

  public static readonly BCRYPT = 'BCRYPT_INSTANCE';
  public static readonly PASSWORD_UTILITY_OPTIONS = 'PASSWORD_UTILITY_OPTIONS';
  private static readonly DEFAULT_SALT_OR_ROUNDS = 10;

  constructor(
    @Inject(PasswordUtilityService.BCRYPT)
    private readonly bcrypt: {
      hash: typeof hash;
      compare: typeof compare;
    },
    @Inject(PasswordUtilityService.PASSWORD_UTILITY_OPTIONS)
    private readonly options: Readonly<PasswordUtilityOptions>,
  ) { }

  hash(plaintText: string): Promise<string> {
    return this.bcrypt.hash(
      plaintText,
      this.options.saltOrRounds ??
        PasswordUtilityService.DEFAULT_SALT_OR_ROUNDS,
    );
  }

  compare(plainText: string, hash: string): Promise<boolean> {
    return this.bcrypt.compare(plainText, hash);
  }

}

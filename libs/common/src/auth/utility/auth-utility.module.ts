import { type DynamicModule, type FactoryProvider, Module, type Provider, type ValueProvider } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { type FactoryProviderOptions } from '../../types/nestjs.js';
import { PasswordUtilityService } from './services/password-utility.service.js';
import { type AuthUtilityOptions } from "./types/auth-utility.options.js";
import { type PasswordUtilityOptions } from "./types/password-utility.options.js";

@Module({})
export class AuthUtilityModule {

  static forRoot(options?: AuthUtilityOptions): DynamicModule {
    return AuthUtilityModule.initialize(true, AuthUtilityModule.syncProviders(options));
  }

  static forFeature(options?: AuthUtilityOptions): DynamicModule {
    return AuthUtilityModule.initialize(false, AuthUtilityModule.syncProviders(options));
  }

  static forRootAsync(options: FactoryProviderOptions<AuthUtilityOptions>): DynamicModule {
    return AuthUtilityModule.initialize(true, AuthUtilityModule.asyncProviders(options));
  }

  static forFeatureAsync(options: FactoryProviderOptions<AuthUtilityOptions>): DynamicModule {
    return AuthUtilityModule.initialize(false, AuthUtilityModule.asyncProviders(options));
  }

  private static syncProviders(options?: AuthUtilityOptions): [ValueProvider<PasswordUtilityOptions>] {
    return [
      {
        provide: PasswordUtilityService.PASSWORD_UTILITY_OPTIONS,
        useValue: options?.password ?? {},
      }
    ]
  }

  private static asyncProviders(options: FactoryProviderOptions<AuthUtilityOptions>): [FactoryProvider<PasswordUtilityOptions>] {
    return [
      {
        provide: PasswordUtilityService.PASSWORD_UTILITY_OPTIONS,
        useFactory: async (...args: any[]) => {
          const authOptions = await options.useFactory(...args);
          return authOptions?.password ?? {};
        },
        inject: options.inject
      }
    ]
  }

  private static initialize(global: boolean,
                            providers: [Provider<PasswordUtilityOptions>]): DynamicModule {
    return {
      module: AuthUtilityModule,
      providers: [
        {
          provide: PasswordUtilityService.BCRYPT,
          useValue: { hash, compare },
        },
        ...providers,
        PasswordUtilityService,
      ],
      exports: [PasswordUtilityService],
      global
    };
  }

}

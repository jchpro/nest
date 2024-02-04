import { reusableApiEnum } from "@jchpro/nest-common/openapi";

enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  PRODUCTION = 'production'
}

reusableApiEnum(Environment, 'Environment');

export { Environment }

import { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';
import { DEBUG, DEVELOPMENT, LogLevels, PRODUCTION } from '../consts/log-levels';

const levelsEnumValues = Object.values(LogLevels);

export const LoggerFactory = {

  /**
   * Sets up built-it Nest.js logger.
   * Returned object can be merged with other options passed as 2nd argument of `NestFactory#create`.
   *
   * @param config If `LogLevels`, a recommended levels set will be used. In any other case value will be passed directly to `Nest.js` so it's logic applies.
   */
  create: function(config?: LogLevels | NestApplicationContextOptions['logger']) {
    let logger: NestApplicationContextOptions['logger'];
    if (typeof config === 'string' && levelsEnumValues.includes(config)) {
      switch (config) {
        case LogLevels.DEBUG:
          logger = DEBUG;
          break;
        case LogLevels.DEVELOPMENT:
          logger = DEVELOPMENT;
          break;
        case LogLevels.PRODUCTION:
          logger = PRODUCTION;
      }
    } else {
      logger = config as NestApplicationContextOptions['logger'];
    }
    return logger;
  }
};


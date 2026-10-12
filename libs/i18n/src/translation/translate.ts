import type { I18nContext, I18nValidationError } from "nestjs-i18n";
import { formatI18nErrors } from 'nestjs-i18n/dist/utils/index.js';
import { I18nMessage } from "../decorators/message.js";

export function translateI18MessageErrors(
  context: I18nContext,
  errors: I18nValidationError[],
  constraintsPrefix: string
): I18nValidationError[] {

  // First, to avoid any unexpected side effects, clone all incoming errors
  const clones = structuredClone(errors);

  // Then, modify the constraints of each error to assign translation keys
  traverseErrors(clones, error => {
    if (error.constraints) {
      for (const constraint of Object.keys(error.constraints)) {
        const inputMessage = error.constraints![constraint];

        // We don't touch custom messages
        if (I18nMessage.isCustom(inputMessage)) {
          continue;
        }

        // Otherwise, replace the placeholder with the automatic translation key
        // which must include arguments separator at the end
        const translationKey = `${constraintsPrefix + constraint}|`;
        error.constraints![constraint] = I18nMessage.replace(inputMessage, translationKey);
      }
    }
  });

  // At last, let the i18n translate as usual
  return formatI18nErrors(clones, context.service, { lang: context.lang });
}

function traverseErrors(errors: I18nValidationError[],
                        cb: (err: I18nValidationError) => void) {
  for (const error of errors) {
    cb(error);
    if (error.children) {
      traverseErrors(error.children, cb);
    }
  }
}

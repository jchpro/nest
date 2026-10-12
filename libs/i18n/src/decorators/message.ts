import type { ValidationOptions } from 'class-validator';
import { randomUUID } from 'crypto';
import { i18nValidationMessage } from "nestjs-i18n";

const placeholder = `<${randomUUID().slice(0, 8)}>:::`;

/**
 * For validation decorators from `class-validator`.
 */
export function I18nMessage(customMessage?: string): Pick<ValidationOptions, 'message'> {
  return {
    message: (args) => {
      if (customMessage) {
        return i18nValidationMessage(customMessage)(args);
      }
      const { constraints, property } = args;
      let { value } = args;
      if (typeof value === 'string') {
        value = value.replace(/:::/g, '');
      }
      return `${placeholder}${JSON.stringify({ value, constraints, property })}`;
    }
  };
}

I18nMessage['getPlaceholder'] = () => placeholder;
I18nMessage['isCustom'] = (template: string) => !template.startsWith(placeholder);
I18nMessage['replace'] = (template: string, message: string) => template.replace(placeholder, message);

/**
 * For translations that should be handled at a later step.
 */
export function I18nDefer(key: string,
                          args?: any): string {
  key = key.replace(/\|/g, '');
  return `i18n(${key}|${JSON.stringify({ ...args })})`;
}

I18nDefer['isTranslatable'] = (key: string) => key.startsWith('i18n(') && key.endsWith(')');
I18nDefer['unwrap'] = (wrapped: string) => {
  const [key, argsRaw] = wrapped.slice(5, -1).split('|');
  return {
    key,
    args: JSON.parse(argsRaw)
  };
}

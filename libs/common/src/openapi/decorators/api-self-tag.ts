import { ApiTags } from '../internal/swagger';

/**
 * Tags controller with the class name, allows passing additional tags.
 */
export function ApiSelfTag(...additionalTags: string[]) {
  return function ApiSelfTagDecorator(target: any) {
    ApiTags(target.name, ...additionalTags)(target);
  };
}

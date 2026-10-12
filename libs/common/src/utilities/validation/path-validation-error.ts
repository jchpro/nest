import { type ValidationError } from "class-validator";

export interface PathValidationError {

  readonly path: string;
  readonly constraints: string[];

}

export function createPathErrors(errors: ValidationError[],
                                 allMessages: string[] = []): PathValidationError[] {
  const output: PathValidationError[] = [];
  traverseErrors(errors, (error, path) => {
    const constraints = Object.values(error.constraints!);
    allMessages.push(...constraints);
    output.push({
      path,
      constraints
    });
  });
  return output;
}

function traverseErrors(errors: ValidationError[],
                        cb: (error: ValidationError, path: string) => void,
                        path: string[] = []) {
  for (const error of errors) {
    const field = error.property;
    if (error.constraints && !!Object.keys(error.constraints).length) {
      cb(error, [...path, field].join('.'))
    }
    if (error.children) {
      traverseErrors(error.children, cb, [...path, field]);
    }
  }
}

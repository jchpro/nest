import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from "../consts/metadata-keys";

@Injectable()
export class PublicAccessAdvisorService {
  constructor(private readonly reflector: Reflector) {}

  isPublicContext(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

}

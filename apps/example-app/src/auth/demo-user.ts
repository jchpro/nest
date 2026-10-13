import { type AuthUserResolver } from '@jchpro/nest-common/auth';
import { type NextFunction, type Request, type Response } from 'express';
import { Permission } from './permission.js';

export interface DemoUser {
  readonly _id: string;
  readonly permissions: Permission[];
}

type RequestWithUser = Request & { user?: DemoUser };

export const DEMO_USER_HEADER = 'X-Demo-User';

/**
 * There is no real authentication in this app. A client picks one of these users
 * with the `X-Demo-User` header (in Swagger UI: the "Authorize" button).
 */
export const DEMO_USERS: Record<string, DemoUser> = {
  admin: { _id: 'admin', permissions: [Permission.CatsWrite, Permission.OwnersWrite] },
  'cat-sitter': { _id: 'cat-sitter', permissions: [Permission.CatsWrite] },
};

/** Stands in for an authentication middleware or guard: puts the demo user on the request. */
export function demoUserMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const name = req.header(DEMO_USER_HEADER);
  req.user = name ? DEMO_USERS[name] : undefined;
  next();
}

/** Tells the authorization mechanism where the user is, usually it is just `request.user`. */
export const demoUserResolver: AuthUserResolver<DemoUser, RequestWithUser> = (req) => req.user;

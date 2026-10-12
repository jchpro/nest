
/**
 *  Should return the user entity from the request for logged-in users, usually it's just `request.user`.
 */
export type AuthUserResolver<TUserEntity = any, TRequest = any> = (request: TRequest) => TUserEntity | undefined;

export interface AuthorizationService<TUserEntity, TPermission> {

  /**
   * Should confirm or deny that user has required permissions.
   */
  validateAuthorization(
    user: TUserEntity,
    requiredPermissions: TPermission[],
  ): boolean | Promise<boolean>;

}

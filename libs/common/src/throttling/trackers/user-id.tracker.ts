/**
 * Tracks requests by the authenticated user's ID (`req.user._id`), so a per-account limit applies regardless
 * of which device or IP the user is on. Falls back to the client IP for unauthenticated requests.
 */
export function userIdTracker(req: Record<string, any>): string {
  const userId = req.user?._id;
  if (userId) {
    return `user:${userId.toString()}`;
  }
  return req.ip;
}

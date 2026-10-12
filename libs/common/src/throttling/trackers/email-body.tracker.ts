/**
 * Tracks requests by the `email` field of the JSON body (case-insensitive), so a per-account limit can't be dodged
 * by rotating IP addresses. Falls back to the client IP when the body carries no usable e-mail.
 * Body parsing happens in middleware, so the body is already available when guards run.
 */
export function emailBodyTracker(req: Record<string, any>): string {
  const email = req.body?.email;
  if (typeof email === 'string' && email.trim()) {
    return `email:${email.trim().toLowerCase()}`;
  }
  return req.ip;
}

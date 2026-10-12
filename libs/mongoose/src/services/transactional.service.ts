import { type ClientSession, type Connection } from "mongoose";

export class TransactionalService {

  constructor(
    protected readonly connection: Connection
  ) {
  }

  /**
   * `callback`'s queries must pass the given session (e.g. `{ session }` on a query's options, or
   * `.session(session)`) to actually run inside the transaction; otherwise they commit immediately as
   * ordinary, non-transactional writes, which both defeats rollback-on-failure and risks double-applying
   * them if the driver retries the callback after a transient error. Existing callers that ignore the
   * argument keep their prior (non-atomic) behaviour unchanged.
   */
  async transactional<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
    return await this.connection.withSession(async session => {
      return await session.withTransaction(() => callback(session));
    });
  }

}

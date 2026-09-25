import mongoose from 'mongoose';
import type { ClientSession } from 'mongodb';

let transactionsSupported: boolean | null = null;

/**
 * Runs `fn` inside a MongoDB transaction when the server supports one (Atlas /
 * any replica set or mongos), otherwise runs it directly. A standalone local
 * mongod can't do transactions, and failing there would break dev.
 *
 * Inside a transaction, Mongoose model operations pick up the session on their
 * own (transactionAsyncLocalStorage, see lib/db/mongodb.ts); native driver calls
 * must pass the `session` argument, which is undefined without a transaction.
 */
export async function withOptionalTransaction<T>(
  fn: (session: ClientSession | undefined) => Promise<T>
): Promise<T> {
  if (transactionsSupported === null) {
    const db = mongoose.connection.db;
    const hello = db ? await db.admin().command({ hello: 1 }).catch(() => null) : null;
    transactionsSupported = !!hello && (hello.setName != null || hello.msg === 'isdbgrid');
  }
  return transactionsSupported ? mongoose.connection.transaction((session) => fn(session)) : fn(undefined);
}

import mongoose from "mongoose";

let connectPromise = null;

/**
 * Connects once and hands back the same promise to every caller after
 * that — api, worker, and any test setup all import this same module,
 * so this needs to be idempotent rather than reconnecting per-caller.
 *
 * MONGODB_URI must point at a replica set (a single-node one is fine
 * for local dev — see docs/local-mongo.md). Workspace creation, and
 * anything else that needs multiple documents to succeed-or-fail
 * together, uses a Mongoose transaction, and transactions are simply
 * not available against a standalone mongod.
 */
export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env and point it at a replica-set-enabled Mongo instance.",
    );
  }
  if (connectPromise) return connectPromise;

  mongoose.set("strictQuery", true);

  connectPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 8000,
    })
    .then((conn) => {
      console.log(`[db] connected to ${conn.connection.name}`);
      return conn;
    })
    .catch((err) => {
      connectPromise = null; // allow a retry on next call instead of caching the failure
      throw err;
    });

  return connectPromise;
}

export async function disconnectDb() {
  if (!connectPromise) return;
  await mongoose.disconnect();
  connectPromise = null;
}

export function isConnected() {
  return mongoose.connection.readyState === 1;
}

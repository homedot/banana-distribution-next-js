import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Cached across hot-reloads in dev and across route handler invocations in
// prod, so we don't open a new connection to Atlas on every request.
const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};
global.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Add it to .env.local (see .env.example).",
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "banana_distribution",
      // Fail within the serverless function's time limit (default would be 30s),
      // e.g. when Atlas Network Access doesn't allow this server's IP.
      serverSelectionTimeoutMS: 8000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Don't keep a failed attempt cached — otherwise every later request fails
    // instantly until the server restarts, even after the cause is fixed.
    cache.promise = null;
    console.error("[db] MongoDB connection failed:", err instanceof Error ? err.message : err);
    throw err;
  }
  return cache.conn;
}

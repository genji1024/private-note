// Lazy Postgres access for private-note (plain Postgres migration path).
//
// IMPORTANT: nothing is created or connected at module import time. Next.js
// evaluates route modules in parallel during `next build`; an import-time
// `new Pool()`/query would break the build. Everything happens on the first
// call to `getDb()` or `getPool()`.
//
// If DATABASE_URL is unset, importing this module is still safe — the error is
// thrown only when a getter is actually called.

import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "@/db/schema";

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;

function ensurePool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Cannot initialize the Postgres connection. " +
        'Set DATABASE_URL (e.g. "postgres://app:app@postgres:5432/private_note") ' +
        "before calling getDb()."
    );
  }

  pool = new Pool({ connectionString });
  return pool;
}

export function getPool(): Pool {
  return ensurePool();
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(ensurePool(), { schema });
  }
  return db;
}

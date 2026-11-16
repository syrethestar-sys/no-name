import 'server-only';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Database = PostgresJsDatabase<typeof schema>;

// Created on first use, not at import, so `next build` (CI) works without DATABASE_URL.
// Reused across hot reloads in dev so connections don't pile up.
const globalForDb = globalThis as unknown as { database?: Database };

export function getDb(): Database {
  if (globalForDb.database) return globalForDb.database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set. See .env.example.');

  // Supabase transaction pooler (port 6543) does not support prepared statements.
  // Idle connections close after 20 s so one the pooler dropped is never reused (that once made
  // every page hang); a stuck connect gives up after 10 s so the page can show its error.
  const client = postgres(databaseUrl, {
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 1800,
  });
  globalForDb.database = drizzle(client, { schema });
  return globalForDb.database;
}

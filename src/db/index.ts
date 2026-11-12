import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set. See .env.example.');

// Supabase transaction pooler (port 6543) does not support prepared statements.
// Reuse one client across hot reloads in dev so connections don't pile up.
const globalForDb = globalThis as unknown as { postgresClient?: postgres.Sql };
const client = globalForDb.postgresClient ?? postgres(databaseUrl, { prepare: false });
if (process.env.NODE_ENV !== 'production') globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });

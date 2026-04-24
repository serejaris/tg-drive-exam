import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set, database features will be unavailable');
}

export const pool = connectionString
  ? new pg.Pool({ connectionString })
  : null;

export const db = pool ? drizzle(pool) : null;

export * from './schema.js';

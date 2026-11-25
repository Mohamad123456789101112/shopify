import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function databaseUnavailableResponse() {
  return Response.json(
    { ok: false, code: "DATABASE_NOT_CONFIGURED", error: "هذه الخدمة غير متاحة حاليًا لأن قاعدة البيانات لم يتم إعدادها بعد. / Database-backed features are not configured yet." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// Do not create a pool or connect during imports/builds. No localhost fallback.
export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_NOT_CONFIGURED");
  return (globalForDb.__arenaNextJsPostgresqlPool ??= new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    max: 5,
  }));
}

export function getDb() {
  return drizzle(getPool());
}

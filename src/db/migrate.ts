import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Pool } from "pg";
import { BOOTSTRAP_SQL } from "./sql";

const VERSION = `20261125-commerce-v1-${createHash("sha256").update(BOOTSTRAP_SQL).digest("hex").slice(0, 12)}`;

/** Transactional, versioned setup; concurrent serverless instances serialize here. */
export async function migrateDatabase(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('bly-schema-migrations'))");
    await client.query(`create table if not exists bly_schema_migrations (
      version text primary key, applied_at timestamptz not null default now()
    )`);
    const existing = await client.query("select 1 from bly_schema_migrations where version = $1", [VERSION]);
    if (!existing.rowCount) {
      const tables = await client.query("select to_regclass('public.auth_users') as name");
      if (!tables.rows[0].name) {
        const baseline = readFileSync(resolve(process.cwd(), "drizzle/0000_perfect_shockwave.sql"), "utf8");
        await client.query(baseline);
      }
      // Also supports installations created by the original archive.
      await client.query(`create table if not exists password_resets (
        token_hash text primary key, user_id uuid not null references auth_users(id) on delete cascade,
        expires_at timestamptz not null, created_at timestamptz not null default now()
      )`);
      await client.query(BOOTSTRAP_SQL);
      await client.query("insert into bly_schema_migrations(version) values ($1)", [VERSION]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

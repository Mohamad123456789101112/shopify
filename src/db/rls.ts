import { sql } from "drizzle-orm";
import { getDb, getPool } from "@/db";
import { BOOTSTRAP_SQL } from "./sql";

export type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

let ready: Promise<void> | null = null;

/** Idempotent security bootstrap (role, RLS, triggers, RPCs) — runs once per process. */
export function ensureDb(): Promise<void> {
  if (!ready) {
    ready = getPool()
      .query(BOOTSTRAP_SQL)
      .then(() => undefined)
      .catch((err) => {
        ready = null;
        throw err;
      });
  }
  return ready;
}

/**
 * Every user-facing query runs here: a transaction that drops to the non-superuser
 * `app_client` role and pins `app.user_id`, so Postgres RLS — not app code — decides
 * what the caller can read or write. Passing `null` = anonymous (storefront) access.
 */
export async function rls<T>(userId: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  await ensureDb();
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId ?? ""}, true)`);
    await tx.execute(sql.raw("set local role app_client"));
    return fn(tx);
  });
}

/** Privileged connection — auth tables, logs and cron-style jobs only. Never reachable from the browser. */
export async function privileged<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  await ensureDb();
  return getDb().transaction(async (tx) => fn(tx));
}

export async function logSecurity(type: string, meta: Record<string, unknown>, actor?: string | null) {
  try {
    await privileged(async (tx) => {
      await tx.execute(
        sql`insert into security_logs(actor, type, meta) values (${actor ?? null}, ${type}, ${JSON.stringify(meta)}::jsonb)`,
      );
    });
  } catch {
    /* logging must never break a request */
  }
}

export async function logAudit(
  actor: string | null,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await privileged(async (tx) => {
      await tx.execute(
        sql`insert into audit_logs(actor, action, target_type, target_id, metadata)
            values (${actor}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(metadata)}::jsonb)`,
      );
    });
  } catch {
    /* noop */
  }
}

export async function rateLimit(key: string, limit: number, windowSecs: number, blockSecs = 0) {
  const res = await privileged(async (tx) =>
    tx.execute(sql`select rl_hit(${key}, ${limit}, ${windowSecs}, ${blockSecs}) as ok`),
  );
  const rows = res.rows as { ok: boolean }[];
  return rows[0]?.ok !== false;
}

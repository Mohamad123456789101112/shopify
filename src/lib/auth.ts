import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { isDatabaseConfigured } from "@/db";
import { privileged, rls, logSecurity, rateLimit } from "@/db/rls";

const scrypt = promisify(_scrypt) as (p: string, s: string, l: number) => Promise<Buffer>;
export const SESSION_COOKIE = "bly_session";
const SESSION_DAYS = 30;

const COMMON_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwerty123", "11111111", "abc12345",
  "letmein1", "welcome1", "admin123", "iloveyou1", "sunshine1", "password123", "football1",
  "baseball1", "dragon123", "monkey123", "qwertyui", "1q2w3e4r", "passw0rd",
]);

export function validatePassword(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 128) return "Password must be at most 128 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must contain letters and numbers.";
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return "This password is too common.";
  return null;
}

export function validEmail(email: string) {
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email);
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(pw, salt, 64);
  return `scrypt$${salt}$${buf.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [, salt, hex] = stored.split("$");
  if (!salt || !hex) return false;
  const buf = await scrypt(pw, salt, 64);
  const a = Buffer.from(hex, "hex");
  return a.length === buf.length && timingSafeEqual(a, buf);
}

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export const RESERVED_SLUGS = [
  "admin", "api", "www", "brandly", "store", "app", "login", "signup", "setup", "track",
  "checkout", "x", "owner", "dashboard", "help", "blog",
];

export function slugify(input: string) {
  const base = (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  return base.length >= 2 ? base : `store-${randomBytes(2).toString("hex")}`;
}

export async function uniqueSlug(desired: string) {
  let base = slugify(desired);
  if (RESERVED_SLUGS.includes(base)) base = `${base}-store`;
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? base : `${base.slice(0, 36)}-${i}`;
    const res = await privileged(async (tx) =>
      tx.execute(sql`select 1 from merchants where store_slug = ${candidate} limit 1`),
    );
    if (res.rows.length === 0) return candidate;
  }
  return `${base.slice(0, 33)}-${randomBytes(3).toString("hex")}`;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isOwner: boolean;
  merchant: {
    id: string;
    storeName: string;
    storeSlug: string;
    plan: "free" | "growth" | "pro";
    billing: "monthly" | "yearly";
    planExpiresAt: string | null;
    subStatus: string;
    suspended: boolean;
    suspendedReason: string | null;
    onboarded: boolean;
  } | null;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isDatabaseConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await privileged(async (tx) => {
    const res = await tx.execute(sql`
      select u.id, u.email, p.name,
        (select coalesce(bool_or(is_active), false) from platform_owners po where po.user_id = u.id) as is_owner,
        m.store_name, m.store_slug, m.plan, m.billing, m.plan_expires_at, m.sub_status,
        m.suspended, m.suspended_reason, m.onboarded
      from sessions s
      join auth_users u on u.id = s.user_id
      left join profiles p on p.id = u.id
      left join merchants m on m.id = u.id
      where s.token_hash = ${sha(token)} and s.expires_at > now() limit 1`);
    return res.rows as Record<string, unknown>[];
  });
  const r = rows[0];
  if (!r) return null;
  return {
    id: String(r.id),
    email: String(r.email),
    name: String(r.name ?? ""),
    isOwner: Boolean(r.is_owner),
    merchant: r.store_slug
      ? {
          id: String(r.id),
          storeName: String(r.store_name),
          storeSlug: String(r.store_slug),
          plan: r.plan as "free" | "growth" | "pro",
          billing: r.billing as "monthly" | "yearly",
          planExpiresAt: r.plan_expires_at ? new Date(r.plan_expires_at as string).toISOString() : null,
          subStatus: String(r.sub_status),
          suspended: Boolean(r.suspended),
          suspendedReason: (r.suspended_reason as string) ?? null,
          onboarded: Boolean(r.onboarded),
        }
      : null,
  };
});

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim().slice(0, 45);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await privileged(async (tx) => {
    await tx.execute(sql`
      insert into sessions(token_hash, user_id, expires_at, ip, ua)
      values (${sha(token)}, ${userId}, now() + interval '${sql.raw(String(SESSION_DAYS))} days',
        ${await clientIp()}, ${(h.get("user-agent") ?? "").slice(0, 200)})`);
    await tx.execute(sql`update auth_users set last_sign_in_at = now() where id = ${userId}`);
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && isDatabaseConfigured()) {
    await privileged(async (tx) => {
      await tx.execute(sql`delete from sessions where token_hash = ${sha(token)}`);
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** Signup = auth user + profile + merchant + empty store (Supabase trigger parity), one transaction. */
export async function signUpMerchant(email: string, password: string, name: string, storeName: string) {
  const slug = await uniqueSlug(storeName || name || "store");
  const hash = await hashPassword(password);
  const id = await privileged(async (tx) => {
    const exists = await tx.execute(sql`select 1 from auth_users where lower(email) = lower(${email}) limit 1`);
    if (exists.rows.length) return null;
    const res = await tx.execute(sql`
      insert into auth_users(email, password_hash) values (${email.toLowerCase()}, ${hash}) returning id`);
    const uid = String((res.rows[0] as { id: string }).id);
    await tx.execute(sql`insert into profiles(id, email, name) values (${uid}, ${email.toLowerCase()}, ${name})`);
    await tx.execute(sql`
      insert into merchants(id, email, name, store_name, store_slug)
      values (${uid}, ${email.toLowerCase()}, ${name}, ${storeName.slice(0, 40)}, ${slug})`);
    await tx.execute(sql`
      insert into stores(merchant_id, settings, site) values (${uid}, '{}'::jsonb, '{}'::jsonb)`);
    await tx.execute(sql`
      insert into notifications(merchant_id, kind, title, text)
      values (${uid}, 'info', 'Welcome to BLY', 'Finish setup to launch your store.')`);
    return uid;
  });
  return { id, slug };
}

export async function signIn(email: string, password: string) {
  const ip = await clientIp();
  const allowed = await rateLimit(`login:${ip}`, 5, 900, 900);
  if (!allowed) {
    await logSecurity("login.rate_limited", { ip });
    return { error: "Too many attempts. Try again in 15 minutes." as const };
  }
  const rows = await privileged(async (tx) => {
    const res = await tx.execute(
      sql`select id, password_hash from auth_users where lower(email) = lower(${email}) limit 1`,
    );
    return res.rows as { id: string; password_hash: string }[];
  });
  const generic = { error: "Invalid email or password." as const };
  if (!rows[0]) {
    await logSecurity("login.failed", { email: email.slice(0, 80), ip });
    return generic;
  }
  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) {
    await logSecurity("login.failed", { email: email.slice(0, 80), ip }, rows[0].id);
    return generic;
  }
  await createSession(rows[0].id);
  await logSecurity("login.success", { ip }, rows[0].id);
  return { id: rows[0].id };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

/** Owner check is server-side and DB-backed (is_platform_owner()). Hiding a route is not security. */
export async function isOwnerDb(userId: string) {
  return rls(userId, async (tx) => {
    const res = await tx.execute(sql`select is_platform_owner() as ok`);
    return Boolean((res.rows[0] as { ok: boolean }).ok);
  });
}

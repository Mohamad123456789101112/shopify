import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { privileged } from "@/db/rls";
import { hashPassword } from "@/lib/auth";

export function isResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_URL);
}

export async function requestPasswordReset(email: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const uid = await privileged(async (tx) => {
    const users = await tx.execute(sql`select id from auth_users where lower(email) = ${email} limit 1`);
    const id = (users.rows[0] as { id: string } | undefined)?.id;
    if (!id) return null;
    await tx.execute(sql`delete from password_resets where user_id = ${id}`);
    await tx.execute(sql`insert into password_resets(token_hash,user_id,expires_at) values (${hash},${id},now() + interval '30 minutes')`);
    return id;
  });
  if (!uid) return;
  const link = new URL("/reset-password", process.env.APP_URL!);
  link.searchParams.set("token", token);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Reset your BLY password",
      text: `Reset your password using this link within 30 minutes:\n${link.toString()}\n\nIf you didn't request this, ignore this email.`,
    }),
  });
  if (!res.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}

export async function resetPassword(token: string, password: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await hashPassword(password);
  return privileged(async (tx) => {
    // DELETE RETURNING makes redemption atomic, including under concurrent requests.
    const res = await tx.execute(sql`delete from password_resets where token_hash = ${hash} and expires_at > now() returning user_id`);
    const uid = (res.rows[0] as { user_id: string } | undefined)?.user_id;
    if (!uid) return false;
    await tx.execute(sql`update auth_users set password_hash = ${passwordHash} where id = ${uid}`);
    await tx.execute(sql`delete from sessions where user_id = ${uid}`);
    await tx.execute(sql`delete from password_resets where user_id = ${uid}`);
    return true;
  });
}

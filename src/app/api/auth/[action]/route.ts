import { isDatabaseConfigured, databaseUnavailableResponse } from "@/db";
import { NextResponse } from "next/server";
import {
  clientIp, createSession, destroySession, getSessionUser, signIn, signUpMerchant, validEmail, validatePassword,
} from "@/lib/auth";
import { logSecurity, rateLimit } from "@/db/rls";
import { isResetEmailConfigured, requestPasswordReset, resetPassword } from "@/lib/password-reset";

export const dynamic = "force-dynamic";
type Body = Record<string, unknown>;
const str = (b: Body, k: string, max = 200) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : "");
const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ ok: false, error: "Request origin is not allowed." }, 403);
  const { action } = await ctx.params;
  if (!["signup", "login", "logout", "reset", "reset-password"].includes(action)) return json({ ok: false, error: "Unknown action" }, 404);
  try {
    if (action === "logout") {
      await destroySession();
      return json({ ok: true });
    }
    if (!isDatabaseConfigured()) return databaseUnavailableResponse();
    const input: unknown = await req.json().catch(() => null);
    if (!input || typeof input !== "object" || Array.isArray(input)) return json({ ok: false, error: "Invalid request body." }, 400);
    const body = input as Body;
    const email = str(body, "email").toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (action === "signup") {
      const name = str(body, "name", 60);
      const storeName = str(body, "storeName", 40) || name;
      if (!validEmail(email)) return json({ ok: false, error: "Enter a valid email address." }, 400);
      if (name.length < 2 || storeName.length < 2) return json({ ok: false, error: "Your name and store name must be at least 2 characters." }, 400);
      const error = validatePassword(password);
      if (error) return json({ ok: false, error }, 400);
      const ip = await clientIp();
      if (!(await rateLimit(`signup:${ip}`, 6, 900, 900))) return json({ ok: false, error: "Too many attempts. Try again later." }, 429);
      const { id } = await signUpMerchant(email, password, name, storeName);
      if (!id) return json({ ok: false, error: "Could not create this account. Try logging in instead." }, 400);
      await createSession(id);
      await logSecurity("signup.success", { ip }, id);
      return json({ ok: true, redirect: "/setup" });
    }

    if (action === "login") {
      if (!validEmail(email) || !password || password.length > 128) return json({ ok: false, error: "Invalid email or password." }, 400);
      const res = await signIn(email, password);
      if ("error" in res) return json({ ok: false, error: res.error }, 400);
      const user = await getSessionUser();
      return json({ ok: true, redirect: user?.isOwner ? "/admin" : user?.merchant?.onboarded ? "/dashboard" : "/setup" });
    }

    if (action === "reset") {
      if (!isResetEmailConfigured()) return json({ ok: false, error: "Password reset email is not configured. Contact the site administrator." }, 503);
      if (!validEmail(email)) return json({ ok: false, error: "Enter a valid email address." }, 400);
      const ip = await clientIp();
      if (!(await rateLimit(`reset:${ip}`, 6, 900, 900))) return json({ ok: false, error: "Too many attempts. Try again later." }, 429);
      await requestPasswordReset(email);
      return json({ ok: true, message: "If an account exists for that email, you will receive a reset link shortly." });
    }

    const error = validatePassword(password);
    if (error) return json({ ok: false, error }, 400);
    const ip = await clientIp();
    if (!(await rateLimit(`reset-redeem:${ip}`, 10, 900, 900))) return json({ ok: false, error: "Too many attempts. Try again later." }, 429);
    if (!(await resetPassword(str(body, "token", 100), password))) return json({ ok: false, error: "This reset link is invalid or expired. Request a new link." }, 400);
    return json({ ok: true, message: "Password updated. Please sign in again.", redirect: "/login" });
  } catch (err) {
    const code = (err as { code?: string })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
    if (code === "23505") return json({ ok: false, error: "Could not create this account. Try a different store name or sign in." }, 409);
    // Never return SQL, connection strings, password hashes or provider responses.
    return json({ ok: false, error: "The service is temporarily unavailable. Please try again shortly.", code: "SERVICE_UNAVAILABLE" }, 503);
  }
}
